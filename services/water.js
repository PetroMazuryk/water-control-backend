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

export const getWaterPrDay = async (userId, timestamp) => {
  const date = new Date(parseInt(timestamp));

  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0o0, 0o0, 0o0, 0o0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const startOfDayTimestamp = startOfDay.getTime();
  const endOfDayTimestamp = endOfDay.getTime();

  const PerDay = await WaterCollection.find({
    owner: userId,
    date: {
      $gte: startOfDayTimestamp,
      $lte: endOfDayTimestamp,
    },
  }).lean();

  if (!PerDay || PerDay.length === 0) {
    return {
      value: [],
      totalAmount: 0,
      totalPercentage: 0,
    };
  }

  const value = PerDay.map(({ _id, owner, ...rest }) => {
    return { id: _id, ...rest };
  });

  const totalAmount = PerDay.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPercentage = parseFloat(
    PerDay.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(2)
  );

  return {
    value,
    totalAmount,
    totalPercentage,
  };
};
