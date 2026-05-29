import { Request, Response } from "express";
import AnalyticsEvent from "../models/AnalyticsEvent.js";
import Order from "../models/Order.js";

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { event, userId, vendorId, metadata } = req.body;
    await AnalyticsEvent.create({ event, userId, vendorId, metadata });
    res.status(201).json({ message: "Event logged" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [eventCounts, orderTrend] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenuePaise: { $sum: "$totalAmountPaise" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ eventCounts, orderTrend });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
