import { Request, Response } from "express";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import User from "../models/User.js";

export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, currentStatus: { $ne: "cancelled" } } },
      {
        $facet: {
          totals: [{ $group: { _id: null, totalOrders: { $sum: 1 }, grossRevenuePaise: { $sum: "$totalAmountPaise" } } }],
          vendors: [{ $group: { _id: "$vendorId", volume: { $sum: 1 } } }, { $sort: { volume: -1 } }, { $limit: 1 }],
          byStatus: [{ $group: { _id: "$currentStatus", count: { $sum: 1 } } }],
        },
      },
    ]);

    const data = results[0];
    const totalOrders = data.totals[0]?.totalOrders ?? 0;
    const grossRevenuePaise = data.totals[0]?.grossRevenuePaise ?? 0;
    const platformFeePaise = Math.round(grossRevenuePaise * 0.1);
    const topVendorId = data.vendors[0]?._id ?? null;

    let topVendorName = null;
    if (topVendorId) {
      const v = await Vendor.findById(topVendorId).select("name");
      topVendorName = v?.name ?? null;
    }

    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();

    res.json({ totalOrders, grossRevenuePaise, platformFeePaise, topVendorId, topVendorName, totalUsers, totalVendors, statusBreakdown: data.byStatus });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, limit = "50" } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.currentStatus = status;
    const orders = await Order.find(filter).populate("vendorId", "name phone").populate("customerId", "phone").sort({ createdAt: -1 }).limit(parseInt(limit as string));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
