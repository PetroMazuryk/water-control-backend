import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import handlebars from "handlebars";
import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { generateTokens } from "../helpers/generateTokens.js";
import { getEnvVar } from "../helpers/getEnvVar.js";
import { sendResetEmail } from "../helpers/sendResetEmail.js";
import { SMTP } from "../constants/SMTP/constants.js";
import { isProduction } from "../config/config.js";

const TEMPLATES_DIR = path.resolve("templates");

const APP_DOMAIN = isProduction
  ? process.env.APP_DOMAIN
  : process.env.APP_DOMAIN_LOCAL;

export const registerUser = async (data) => {
  const { email, password } = data;
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw createHttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const generatedAvatar = gravatar.url(email);
  const verificationToken = crypto.randomUUID();

  return await User.create({
    email,
    password: hashPassword,
    avatarURL: `http:${generatedAvatar}`,
    verificationToken,
  });
};

export const loginUser = async (email, password) => {
  const existedUser = await User.findOne({ email });
  if (!existedUser) {
    throw createHttpError(401, "Email or password is wrong");
  }

  const isMatch = await bcrypt.compare(password, existedUser.password);
  if (!isMatch) {
    throw createHttpError(401, "Email or password is wrong");
  }

  const tokens = generateTokens(existedUser);

  await User.findByIdAndUpdate(existedUser._id, { token: tokens.accessToken });

  return { user: existedUser, tokens };
};

export const refreshUserSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw createHttpError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw createHttpError(401, "User not found");
  }

  const tokens = generateTokens(user);

  await User.findByIdAndUpdate(user._id, { token: tokens.accessToken });

  return tokens;
};

export const logoutUser = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {}
  if (decoded) await User.findByIdAndUpdate(decoded.id, { token: null });
};

export const getCurrentUser = async (userId) => {
  return await User.findById(
    userId,
    "name weight dailyActiveTime dailyWaterConsumption gender photo email access"
  );
};

export const updateUserDetails = async (userId, data) => {
  const result = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    {
      new: true,
      fields:
        "name weight dailyActiveTime dailyWaterConsumption gender photo email",
    }
  );

  if (!result) {
    throw createHttpError(404, "User not found");
  }

  return result;
};

export const uploadAvatarService = async (userId, urlPhoto) => {
  const { value } = await User.findByIdAndUpdate(
    { _id: userId },
    { photo: urlPhoto },
    { new: true, includeResultMetadata: true }
  );

  return { photo: value.photo };
};

export const getUserCountService = async () => {
  const count = await User.countDocuments();

  const users = await User.find({}, "email _id access");

  const userData = users.map((user) => ({
    id: user._id,
    email: user.email,
    access: user.access,
  }));

  return { count, users: userData };
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, getEnvVar("JWT_SECRET"));
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await User.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await User.updateOne({ _id: user._id }, { password: encryptedPassword });
};

export const requestResetToken = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar("JWT_SECRET"),
    {
      expiresIn: "5m",
    }
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    "reset-password-email.html"
  );

  const templatesSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templatesSource);
  const html = template({
    email: user.email,
    link: `${APP_DOMAIN}/reset-password?token=${resetToken}`,
  });

  await sendResetEmail({
    from: getEnvVar(SMTP.SMTP_EMAIL),
    to: email,
    subject: "Reset your password",
    html,
  });
};
