import express from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { schemas } from "../models/user.js";
import { checkAuth } from "../middlewares/checkAuth.js";

import { upload } from "../middlewares/upload.js";
import { validateMongoId } from "../middlewares/validateMongoId.js";

import {
  register,
  login,
  refreshTokens,
  logout,
  currentUser,
  updateUser,
  uploadAvatar,
  getUserCount,
  updateUserAccess,
  googleAuth,
  googleRedirect,
  resetPasswordController,
} from "../controllers/users.js";

const usersRouter = express.Router();

usersRouter.get("/google", ctrlWrapper(googleAuth));
usersRouter.get("/google-redirect", ctrlWrapper(googleRedirect));

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

usersRouter.patch(
  "/photo",
  checkAuth,
  upload.single("avatar"),
  ctrlWrapper(uploadAvatar)
);

usersRouter.get("/count", ctrlWrapper(getUserCount));

usersRouter.patch(
  "/:id/access",
  validateMongoId(),
  validateBody(schemas.updateUserAccessSchema),
  ctrlWrapper(updateUserAccess)
);

usersRouter.post(
  "/reset-password",
  validateBody(schemas.resetPasswordSchema),
  ctrlWrapper(resetPasswordController)
);

export default usersRouter;
