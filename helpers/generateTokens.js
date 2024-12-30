import jwt from "jsonwebtoken";

const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

export const generateTokens = (user) => {
  const payload = { id: user._id };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "60m",
  });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "8d",
  });

  return { accessToken, refreshToken };
};
