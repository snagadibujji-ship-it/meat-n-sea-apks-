import { Request, Response } from "express";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, limit = "20" } = req.query as { q: string; limit: string };
    const regex = new RegExp(q, "i");
    const lim = parseInt(limit);

    const [vendors, products] = await Promise.all([
      Vendor.find({ name: regex, isOpen: true }).limit(lim),
      Product.find({ $or: [{ name: regex }, { description: regex }, { category: regex }], isOutOfStock: false }).limit(lim),
    ]);

    res.json({ vendors, products, query: q });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
