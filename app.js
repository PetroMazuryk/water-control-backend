import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import waterRouter from "./routes/water.js";
import usersRouter from "./routes/users.js";

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};

export const app = express();

app.use(morgan("tiny"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/water", waterRouter);

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});
