import crypto from "crypto";
import bcrypt from "bcrypt";
import gravatar from "gravatar";
import createHttpError from "http-errors";
import { User } from "../models/user.js";

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
