import { Request, Response } from "express";
import Coupon from "../models/Coupon.js";
import { logger } from "../lib/logger.js";

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountPaise, discountPercent, maxUsage, expiresAt } = req.body;
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPaise: discountPaise || 0,
      discountPercent,
      maxUsage: maxUsage || 100,
      expiresAt: new Date(expiresAt),
    });
    res.status(201).json(coupon);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Coupon code already exists" });
      return;
    }
    logger.error({ error }, "createCoupon error");
    res.status(500).json({ error: "Failed to create coupon" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    logger.error({ error }, "getCoupons error");
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
};
