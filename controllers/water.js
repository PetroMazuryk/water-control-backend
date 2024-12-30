import { createWater } from "../services/water.js";

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
