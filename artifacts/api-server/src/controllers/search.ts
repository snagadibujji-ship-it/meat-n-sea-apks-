import { Request, Response } from "express";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import { logger } from "../lib/logger.js";

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, limit = "20" } = req.query as { q: string; limit: string };
    if (!q || q.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQ, "i");
    const lim = Math.min(parseInt(limit) || 20, 50);

    const [vendors, products] = await Promise.all([
      Vendor.find({ name: regex, isOpen: true }).limit(lim),
      Product.find({ $or: [{ name: regex }, { description: regex }, { category: regex }], isOutOfStock: false }).limit(lim),
    ]);

    res.json({ vendors, products, query: q });
  } catch (error) {
    logger.error({ error }, "globalSearch error");
    res.status(500).json({ error: "Search failed" });
  }
};
