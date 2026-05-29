import { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { street, city, coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: { street, city: city || "", coordinates: coordinates || [0, 0] } } },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user.addresses);
  } catch (error) {
    logger.error({ error }, "addAddress error");
    res.status(500).json({ error: "Failed to add address" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { addressId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: new mongoose.Types.ObjectId(addressId as string) } } },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user.addresses);
  } catch (error) {
    logger.error({ error }, "deleteAddress error");
    res.status(500).json({ error: "Failed to delete address" });
  }
};
