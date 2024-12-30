import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import createHttpError from "http-errors";

export const checkAuth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return next(createHttpError(401, "Not authorized"));
    }

    const [bearer, token] = authorizationHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      return next(createHttpError(401, "Not authorized"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(createHttpError(401, "Invalid or expired token"));
    }

    const user = await User.findById(decoded.id);
    if (!user || user.token !== token) {
      return next(createHttpError(401, "Not authorized"));
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      weight: user.weight,
      dailyActiveTime: user.dailyActiveTime,
      dailyWaterConsumption: user.dailyWaterConsumption,
      gender: user.gender,
      photo: user.photo,
    };

    next();
  } catch (error) {
    next(error);
  }
};
