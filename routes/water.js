import express from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { ctrlWrapper } from "../decorators/ctrlWrapper.js";
import { validateBody } from "../middlewares/validateBody.js";
import { validateMongoId } from "../middlewares/validateMongoId.js";
import { schemas } from "../models/water.js";
import {
  createWaterController,
  getWaterByIdController,
  updateWaterController,
  deleteWaterController,
  getWaterPrDayController,
} from "../controllers/water.js";

const waterRouter = express.Router();
waterRouter.use(checkAuth);

waterRouter.post(
  "/",
  validateBody(schemas.createWaterSchema),
  ctrlWrapper(createWaterController)
);

waterRouter.get("/:id", validateMongoId(), ctrlWrapper(getWaterByIdController));

waterRouter.patch(
  "/:id",
  validateMongoId(),
  validateBody(schemas.updateWaterSchema),
  ctrlWrapper(updateWaterController)
);

waterRouter.delete(
  "/:id",
  validateMongoId(),
  ctrlWrapper(deleteWaterController)
);

waterRouter.get("/day/:date", ctrlWrapper(getWaterPrDayController));

export default waterRouter;
