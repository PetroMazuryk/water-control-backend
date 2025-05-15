import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  getCurrentUser,
  updateUserDetails,
  uploadAvatarService,
  getUserCountService,
} from "../services/users.js";
import { User } from "../models/user.js";
import { saveFileToCloudinary } from "../helpers/saveFileToCloudinary.js";
import { isProduction } from "../config/config.js";
import queryString from "query-string";
import fetch from "node-fetch";
import bcrypt from "bcrypt";
import crypto from "crypto";
import createHttpError from "http-errors";
import { generateTokens } from "../helpers/generateTokens.js";

const REDIRECT_URI = isProduction
  ? "https://water-control-backend.onrender.com/api/users/google-redirect"
  : "http://localhost:4444/api/users/google-redirect";

const APP_DOMAIN = isProduction
  ? process.env.APP_DOMAIN
  : process.env.APP_DOMAIN_LOCAL;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
};

export const googleAuth = async (req, res, next) => {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};

export const googleRedirect = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const urlObj = new URL(fullUrl);
  const urlParams = queryString.parse(urlObj.search);
  const code = urlParams.code;

  const tokenDataResponse = await fetch(`https://oauth2.googleapis.com/token`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (tokenDataResponse.status !== 200) {
    throw createHttpError(500, "Internal Server Error");
  }

  const tokenData = await tokenDataResponse.json();

  const userDataResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  if (userDataResponse.status !== 200) {
    throw createHttpError(500, "Internal Server Error");
  }

  const userData = await userDataResponse.json();

  let user = await User.findOne({ email: userData.email });

  if (user) {
    const { accessToken, refreshToken } = generateTokens(user);

    await User.findByIdAndUpdate(user._id, { token: accessToken });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const stringifiedParams = queryString.stringify({
      token: JSON.stringify(accessToken),
      user: JSON.stringify({
        email: user.email,
        name: user.name,
        weight: user.weight,
        dailyActiveTime: user.dailyActiveTime,
        dailyWaterConsumption: user.dailyWaterConsumption,
        gender: user.gender,
        photo: user.photo,
      }),
    });

    return res.redirect(`${APP_DOMAIN}/?${stringifiedParams}`);
  }

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const newUser = await User.create({
    name: userData.name || "User",
    email: userData.email,
    password: passwordHash,
    photo: userData.picture || null,
    oauth: true,
  });

  const { accessToken, refreshToken } = generateTokens(newUser);

  await User.findByIdAndUpdate(newUser._id, { token: accessToken });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const stringifiedParams = queryString.stringify({
    token: JSON.stringify(accessToken),
    user: JSON.stringify({
      email: newUser.email,
      name: newUser.name,
      weight: newUser.weight,
      dailyActiveTime: newUser.dailyActiveTime,
      dailyWaterConsumption: newUser.dailyWaterConsumption,
      gender: newUser.gender,
      photo: newUser.photo,
    }),
  });

  return res.redirect(`${APP_DOMAIN}/?${stringifiedParams}`);
};

export const register = async (req, res, next) => {
  const newUser = await registerUser(req.body);
  const { email } = newUser;
  res.status(201).json({
    user: {
      email,
    },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const { user, tokens } = await loginUser(email, password);

  res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

  res.status(200).json({
    token: tokens.accessToken,
    user: {
      email: user.email,
      name: user.name,
      weight: user.weight,
      dailyActiveTime: user.dailyActiveTime,
      dailyWaterConsumption: user.dailyWaterConsumption,
      gender: user.gender,
      photo: user.photo,
      access: user.access,
    },
  });
};

export const refreshTokens = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const tokens = await refreshUserSession(refreshToken);

  res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

  res.status(200).json({ token: tokens.accessToken });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  await logoutUser(refreshToken);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(200).json({ message: "Logout success" });
};

export const currentUser = async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    email: user.email,
    name: user.name,
    weight: user.weight,
    dailyActiveTime: user.dailyActiveTime,
    dailyWaterConsumption: user.dailyWaterConsumption,
    gender: user.gender,
    photo: user.photo,
    access: user.access,
  });
};

export const updateUser = async (req, res, next) => {
  const {
    email,
    name,
    weight,
    dailyActiveTime,
    dailyWaterConsumption,
    gender,
    photo,
  } = await updateUserDetails(req.user.id, req.body);
  res.json({
    email,
    name,
    weight,
    dailyActiveTime,
    dailyWaterConsumption,
    gender,
    photo,
  });
};

export const uploadAvatar = async (req, res, next) => {
  if (!req.file) {
    throw createHttpError(400, "File not provided");
  }
  const photo = req.file;
  const url = await saveFileToCloudinary(photo);
  const data = await uploadAvatarService(req.user.id, url);
  res.json(data);
};

export const getUserCount = async (req, res) => {
  const { count, users } = await getUserCountService();
  res.status(200).json({ count, users });
};

export const updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { access } = req.body;

  const user = await User.findByIdAndUpdate(id, { access }, { new: true });

  if (!user) {
    throw HttpError(404, `User with ID ${id} not found.`);
  }

  res.status(200).json({ message: "Access updated successfully.", user });
};
