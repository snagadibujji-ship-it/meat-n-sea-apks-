import { Request, Response } from "express";
import Collection from "../models/Collection.js";
import Product from "../models/Product.js";
import StudioPlan from "../models/StudioPlan.js";

export const getCollections = async (req: Request, res: Response) => {
  try {
    const collections = await Collection.find({ isActive: true }).populate("products").sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCollectionBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const collection = await Collection.findOne({ slug, isActive: true }).populate("products");
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFreshness = async (req: Request, res: Response) => {
  try {
    const collections = await Collection.find({ isActive: true }).select("name slug freshnessHours harvestTime");
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, imageUrl, products, freshnessHours, harvestTime } = req.body;
    const collection = await Collection.create({ name, slug, description, imageUrl, products: products || [], freshnessHours, harvestTime });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateFreshness = async (req: Request, res: Response) => {
  try {
    const { slug, freshnessHours, harvestTime } = req.body;
    const collection = await Collection.findOneAndUpdate({ slug }, { freshnessHours, harvestTime }, { new: true });
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
