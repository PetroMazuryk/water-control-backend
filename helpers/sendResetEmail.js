import nodemailer from "nodemailer";
import { getEnvVar } from "./getEnvVar.js";
import { SMTP } from "../constants/SMTP/constants.js";

const transporter = nodemailer.createTransport({
  service: getEnvVar(SMTP.SMTP_SERViCE),
  auth: {
    user: getEnvVar(SMTP.SMTP_EMAIL),
    pass: getEnvVar(SMTP.SMTP_PASSWORD),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendResetEmail = async (options) => {
  try {
    const info = await transporter.sendMail(options);
    return info;
  } catch (error) {
    throw new Error("Failed to send email. Please try again later.");
  }
};
