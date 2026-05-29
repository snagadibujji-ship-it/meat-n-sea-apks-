import { Request, Response } from "express";
import Rider from "../models/Rider.js";
import Order from "../models/Order.js";
import { logger } from "../lib/logger.js";

const DEFAULT_COORDINATES: [number, number] = [0, 0];

export const getMyRider = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    let rider = await Rider.findOne({ userId });
    if (!rider) {
      rider = await Rider.create({
        userId,
        location: { type: "Point", coordinates: DEFAULT_COORDINATES },
        isOnline: false,
        status: "offline",
      });
    }
    res.json(rider);
  } catch (error) {
    logger.error({ error }, "getMyRider error");
    res.status(500).json({ error: "Failed to fetch rider profile" });
  }
};

export const updateRiderStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { isOnline, lat, lng } = req.body;

    let rider = await Rider.findOne({ userId });
    if (!rider) {
      const coordinates: [number, number] =
        typeof lat === "number" && typeof lng === "number" ? [lng, lat] : DEFAULT_COORDINATES;
      rider = await Rider.create({
        userId,
        location: { type: "Point", coordinates },
        isOnline: false,
        status: "offline",
      });
    }

    rider.isOnline = isOnline;
    rider.status = isOnline ? "available" : "offline";
    rider.lastPing = new Date();

    if (typeof lat === "number" && typeof lng === "number") {
      rider.location = { type: "Point", coordinates: [lng, lat] };
    }

    await rider.save();
    res.json(rider);
  } catch (error) {
    logger.error({ error }, "updateRiderStatus error");
    res.status(500).json({ error: "Failed to update rider status" });
  }
};

export const getRiderOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rider = await Rider.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: "Rider profile not found" });
      return;
    }

    const { status } = req.query;
    const filter: Record<string, unknown> = { partnerId: rider._id };
    if (status) filter.currentStatus = status;

    const orders = await Order.find(filter).sort({ updatedAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    logger.error({ error }, "getRiderOrders error");
    res.status(500).json({ error: "Failed to fetch rider orders" });
  }
};
