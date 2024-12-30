import express from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { validateBody } from "../middlewares/validateBody.js";
import { validateMongoId } from "../middlewares/validateMongoId.js";
import { schemas } from "../models/water.js";
import {
  createWaterController,
  getWaterByIdController,
} from "../controllers/water.js";

const waterRouter = express.Router();
waterRouter.use(checkAuth);

waterRouter.post(
  "/",
  validateBody(schemas.createWaterSchema),
  ctrlWrapper(createWaterController)
);

waterRouter.get("/:id", validateMongoId(), ctrlWrapper(getWaterByIdController));

export default waterRouter;
