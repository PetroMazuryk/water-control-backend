import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import waterRouter from "./routes/water.js";
import usersRouter from "./routes/users.js";

const corsOptions = {
  origin: ["https://petromazuryk.github.io", "http://localhost:5173"],
  credentials: true,
};

// if (process.env.NODE_ENV === "production") {
//   console.log("Running in production mode");
// } else {
//   console.log("Running in development mode");
// }

export const app = express();

app.use(morgan("tiny"));
app.options("*", cors(corsOptions));
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
