import express from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { validateBody } from "../middlewares/validateBody.js";
import { schemas } from "../models/water.js";
import { createWaterController } from "../controllers/water.js";

const waterRouter = express.Router();
waterRouter.use(checkAuth);

waterRouter.post(
  "/",
  validateBody(schemas.createWaterSchema),
  ctrlWrapper(createWaterController)
);

export default waterRouter;
