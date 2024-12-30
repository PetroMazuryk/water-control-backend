import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";

export const validateMongoId =
  (idName = "id") =>
  (req, res, next) => {
    const id = req.params[idName];

    if (!id) {
      return next(
        createHttpError(400, `Missing required parameter: ${idName}`)
      );
    }

    if (!isValidObjectId(id)) {
      return next(createHttpError(400, `Inval id ${id}`));
    }

    next();
  };
