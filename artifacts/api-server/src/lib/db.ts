import mongoose from "mongoose";
import { logger } from "./logger.js";

const MONGO_URI = process.env["MONGO_URI"] ?? "mongodb://localhost:27017/meat-n-sea";

let retryCount = 0;
const MAX_RETRIES = 5;

export const connectDB = async (): Promise<void> => {
  while (retryCount < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
      });
      logger.info("Connected to MongoDB");
      retryCount = 0;
      return;
    } catch (err) {
      retryCount++;
      logger.error({ err, retryCount }, "Failed to connect to MongoDB — will retry");
      if (retryCount >= MAX_RETRIES) {
        logger.error("MongoDB connection failed after max retries. Server will run without DB.");
        return;
      }
      await new Promise((r) => setTimeout(r, 5000 * retryCount));
    }
  }
};
