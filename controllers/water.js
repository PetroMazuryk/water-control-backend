import { createWater, getWaterById } from "../services/water.js";

export const createWaterController = async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
    userNorm: req.user.dailyWaterConsumption,
  };

  const water = await createWater(data);

  res.status(201).json({
    status: 201,
    message: "Successfully created a water!",
    data: water,
  });
};

export const getWaterByIdController = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const water = await getWaterById(id, userId);

  if (!water) {
    next(createHttpError(404, "Water not found"));
    return;
  }

  res.status(200).json({
    status: 200,
    message: `Successfully found water with id ${id}!`,
    data: water,
  });
};
