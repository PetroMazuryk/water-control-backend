import express from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { schemas } from "../models/user.js";
import { register, login, logout } from "../controllers/users.js";

const usersRouter = express.Router();

usersRouter.post(
  "/register",
  validateBody(schemas.userRegisterSchema),
  ctrlWrapper(register)
);

usersRouter.post(
  "/login",
  validateBody(schemas.loginUserSchema),
  ctrlWrapper(login)
);

usersRouter.post("/logout", ctrlWrapper(logout));

export default usersRouter;
