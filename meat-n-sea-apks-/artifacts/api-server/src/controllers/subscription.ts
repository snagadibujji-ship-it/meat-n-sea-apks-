import { Request, Response } from "express";
import StudioPlan from "../models/StudioPlan.js";
import StudioSubscription from "../models/StudioSubscription.js";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await StudioPlan.find({ isActive: true }).sort({ pricePaise: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, pricePaise, intervalDays, curatedItems } = req.body;
    const plan = await StudioPlan.create({ name, description, pricePaise, intervalDays, curatedItems });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { planId, deliveryDay, deliveryAddress, nextDeliveryAt } = req.body;

    const existing = await StudioSubscription.findOne({ userId, status: "active" });
    if (existing) return res.status(409).json({ error: "Already have an active subscription" });

    const sub = await StudioSubscription.create({ userId, planId, deliveryDay, deliveryAddress, nextDeliveryAt: new Date(nextDeliveryAt) });
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const sub = await StudioSubscription.findOne({ userId }).populate("planId").sort({ createdAt: -1 });
    if (!sub) return res.status(404).json({ error: "No subscription found" });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sub = await StudioSubscription.findByIdAndUpdate(id, { status }, { new: true });
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
