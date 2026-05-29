import { Request, Response } from "express";
import Collection from "../models/Collection.js";
import Product from "../models/Product.js";
import StudioPlan from "../models/StudioPlan.js";
import { logger } from "../lib/logger.js";

export const getCollections = async (req: Request, res: Response) => {
  try {
    const collections = await Collection.find({ isActive: true }).populate("products").sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    logger.error({ error }, "getCollections error");
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};

export const getCollectionBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const collection = await Collection.findOne({ slug, isActive: true }).populate("products");
    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    res.json(collection);
  } catch (error) {
    logger.error({ error }, "getCollectionBySlug error");
    res.status(500).json({ error: "Failed to fetch collection" });
  }
};

export const getFreshness = async (req: Request, res: Response) => {
  try {
    const collections = await Collection.find({ isActive: true }).select("name slug freshnessHours harvestTime");
    res.json(collections);
  } catch (error) {
    logger.error({ error }, "getFreshness error");
    res.status(500).json({ error: "Failed to fetch freshness data" });
  }
};

export const getStudioHome = async (req: Request, res: Response) => {
  try {
    const [collections, plans, featuredProducts] = await Promise.all([
      Collection.find({ isActive: true }).limit(5),
      StudioPlan.find({ isActive: true }).sort({ pricePaise: 1 }),
      Product.find({ isOutOfStock: false }).limit(8).sort({ createdAt: -1 }),
    ]);
    res.json({ collections, plans, featuredProducts });
  } catch (error) {
    logger.error({ error }, "getStudioHome error");
    res.status(500).json({ error: "Failed to fetch studio home" });
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, imageUrl, products, freshnessHours, harvestTime } = req.body;
    const collection = await Collection.create({ name, slug, description, imageUrl, products: products || [], freshnessHours, harvestTime });
    res.status(201).json(collection);
  } catch (error) {
    logger.error({ error }, "createCollection error");
    res.status(500).json({ error: "Failed to create collection" });
  }
};

export const updateFreshness = async (req: Request, res: Response) => {
  try {
    const { slug, freshnessHours, harvestTime } = req.body;
    const collection = await Collection.findOneAndUpdate({ slug }, { freshnessHours, harvestTime }, { new: true });
    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    res.json(collection);
  } catch (error) {
    logger.error({ error }, "updateFreshness error");
    res.status(500).json({ error: "Failed to update freshness" });
  }
};
