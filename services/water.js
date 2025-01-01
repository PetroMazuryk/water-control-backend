import { WaterCollection } from "../models/water.js";

export const createWater = async (payload) => {
  let { amount, date, norm, userId, userNorm } = payload;

  if (!norm) {
    norm = userNorm;
  }

  const percentage = ((amount / (norm * 1000)) * 100).toFixed(2);
  const water = await WaterCollection.create({
    amount,
    date,
    norm,
    percentage,
    owner: userId,
  });

  const { _id, owner, ...other } = water._doc;
  const data = { id: _id, ...other };
  return data;
};

export const getWaterById = async (waterId, userId) => {
  return await WaterCollection.findOne(
    { _id: waterId, owner: userId },
    "-_id -owner"
  );
};

export const updateWaterById = async (waterId, userId, payload) => {
  const water = await WaterCollection.findOne({ _id: waterId, owner: userId });

  if (!water) return null;

  const {
    amount = water.amount,
    date = water.date,
    norm = water.norm,
  } = payload;

  if (typeof amount !== "number" || typeof norm !== "number") {
    throw new Error("Invalid payload: 'amount' and 'norm' must be numbers");
  }

  const percentage = ((amount / (norm * 1000)) * 100).toFixed(2);

  const updatedWater = await WaterCollection.findOneAndUpdate(
    { _id: waterId, owner: userId },
    { amount, date, norm, percentage },
    { new: true }
  );

  if (!updatedWater) return null;

  const { _id, owner, ...other } = updatedWater.toObject();
  return { id: _id, ...other };
};

export const deleteWaterById = async (waterId, userId) => {
  const water = await WaterCollection.findOneAndDelete({
    _id: waterId,
    owner: userId,
  });

  if (!water) return null;

  const { _id, owner, ...other } = water._doc;
  const data = { id: _id, ...other };
  return data;
};
