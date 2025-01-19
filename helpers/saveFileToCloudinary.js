import cloudinary from "cloudinary";
import fs from "node:fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const env = (name, defaultValue) => {
  const value = process.env[name];

  if (value) return value;

  if (defaultValue) return defaultValue;

  throw new Error(`Missing: process.env['${name}'].`);
};

export const TEMP_UPLOAD_DIR = path.join(process.cwd(), "temp");

const CLOUDINARY = {
  CLOUD_NAME: env("CLOUDINARY_CLOUD_NAME"),
  API_KEY: env("CLOUDINARY_API_KEY"),
  API_SECRET: env("CLOUDINARY_API_SECRET"),
};

cloudinary.v2.config({
  secure: true,
  cloud_name: CLOUDINARY.CLOUD_NAME,
  api_key: CLOUDINARY.API_KEY,
  api_secret: CLOUDINARY.API_SECRET,
});

export const saveFileToCloudinary = async (file) => {
  try {
    const response = await cloudinary.v2.uploader.upload(file.path);
    await fs.unlink(file.path);
    return response.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};
