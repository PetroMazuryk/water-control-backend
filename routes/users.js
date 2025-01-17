import express from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { schemas } from "../models/user.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import {
  register,
  login,
  refreshTokens,
  logout,
  currentUser,
  updateUser,
} from "../controllers/users.js";

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

usersRouter.post("/refresh", ctrlWrapper(refreshTokens));

usersRouter.get("/current", checkAuth, ctrlWrapper(currentUser));

usersRouter.post("/logout", checkAuth, ctrlWrapper(logout));

usersRouter.patch(
  "/info",
  checkAuth,
  validateBody(schemas.infoUserSchema),
  ctrlWrapper(updateUser)
);

export default usersRouter;
