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
import { saveFileToCloudinary } from "../helpers/saveFileToCloudinary.js";

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

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 днів
  });

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
    },
  });
};

export const refreshTokens = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const tokens = await refreshUserSession(refreshToken);

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  res.status(200).json({ token: tokens.accessToken });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  await logoutUser(refreshToken);

  const isProduction = process.env.NODE_ENV === "production";
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
  const { count, emails } = await getUserCountService();
  res.status(200).json({ count, emails });
};
