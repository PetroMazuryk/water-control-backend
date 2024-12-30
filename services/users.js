import crypto from "crypto";
import bcrypt from "bcrypt";
import gravatar from "gravatar";
import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { generateTokens } from "../helpers/generateTokens.js";

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

export const logoutUser = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {}
  if (decoded) await User.findByIdAndUpdate(decoded.id, { token: null });
};
