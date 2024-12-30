import express from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { schemas } from "../models/user.js";
import { register } from "../controllers/users.js";

const usersRouter = express.Router();

usersRouter.post(
  "/register",
  validateBody(schemas.userRegisterSchema),
  ctrlWrapper(register)
);

export default usersRouter;
