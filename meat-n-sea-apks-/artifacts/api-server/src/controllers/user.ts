import { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { street, city, coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: { street, city: city || "", coordinates: coordinates || [0, 0] } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { addressId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: new mongoose.Types.ObjectId(addressId) } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
