import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import UserRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

const SERVERPORT = process.env.PORT;
app.use("/api/auth", authRoutes);
app.use("/api/users", UserRoutes);

app.listen(SERVERPORT, () => {
  console.log(`The server has started at port ${SERVERPORT}`);
});
