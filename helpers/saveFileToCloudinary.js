import cloudinary from "cloudinary";
import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config();

const env = (name, defaultValue) => {
  const value = process.env[name];
  if (value) return value;
  if (defaultValue) return defaultValue;
  throw new Error(`Missing: process.env['${name}'].`);
};

cloudinary.v2.config({
  secure: true,
  cloud_name: env("CLOUD_NAME"),
  api_key: env("CLOUD_API_KEY"),
  api_secret: env("CLOUD_API_SECRET"),
});

export const saveFileToCloudinary = async (file) => {
  try {
    const response = await cloudinary.v2.uploader.upload(file.path);
    await fs.unlink(file.path);
    return response.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload error: ${error.message}`);
  }
};
