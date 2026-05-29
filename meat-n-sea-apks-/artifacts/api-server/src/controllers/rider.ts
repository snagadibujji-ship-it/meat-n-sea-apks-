import { Request, Response } from "express";
import Rider from "../models/Rider.js";
import Order from "../models/Order.js";

export const getMyRider = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let rider = await Rider.findOne({ userId });
    if (!rider) {
      rider = await Rider.create({
        userId,
        location: { type: "Point", coordinates: [77.5946, 12.9716] },
        isOnline: false,
        status: "offline",
      });
    }
    res.json(rider);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateRiderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { isOnline } = req.body;
    let rider = await Rider.findOne({ userId });
    if (!rider) {
      rider = await Rider.create({
        userId,
        location: { type: "Point", coordinates: [77.5946, 12.9716] },
        isOnline: false,
        status: "offline",
      });
    }

    rider.isOnline = isOnline;
    rider.status = isOnline ? "available" : "offline";
    rider.lastPing = new Date();
    await rider.save();
    res.json(rider);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getRiderOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rider = await Rider.findOne({ userId });
    if (!rider) return res.status(404).json({ error: "Rider not found" });

    const { status } = req.query;
    const filter: Record<string, unknown> = { partnerId: rider._id };
    if (status) filter.currentStatus = status;

    const orders = await Order.find(filter).sort({ updatedAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
