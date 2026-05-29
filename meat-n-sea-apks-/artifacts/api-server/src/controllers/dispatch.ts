import { Request, Response } from "express";
import Rider from "../models/Rider.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import mongoose from "mongoose";
import { redisClient } from "../lib/redis.js";
import { getIO } from "../socket.js";

export const dispatchToNearestRider = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.currentStatus !== "ready") return res.status(400).json({ error: "Order must be ready before dispatch" });

    const redisKey = `dispatch:${orderId}`;
    const existingOffer = await redisClient.get(redisKey);
    if (existingOffer) return res.status(409).json({ error: "Order already has an active dispatch offer pending" });

    const vendor = await Vendor.findById(order.vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const availableRiders = await Rider.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [vendor.location.coordinates[0], vendor.location.coordinates[1]] },
          distanceField: "distance",
          maxDistance: 10000,
          spherical: true,
          query: { isOnline: true, status: "available" },
        },
      },
      { $limit: 1 },
    ]);

    if (availableRiders.length === 0) return res.status(404).json({ error: "No available riders nearby" });

    const selectedRiderId = availableRiders[0]._id.toString();
    await redisClient.setex(redisKey, 60, selectedRiderId);

    order.offeredRiderId = new mongoose.Types.ObjectId(selectedRiderId);
    await order.save();

    try {
      getIO().to(`rider_${selectedRiderId}`).emit("order_assigned", {
        orderId: order._id.toString(),
        vendorId: order.vendorId.toString(),
      });
    } catch {}

    res.json({ message: "Dispatch offered to rider", riderId: selectedRiderId, expiresIn: 60 });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
