import { Request, Response } from "express";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import mongoose from "mongoose";
import { getIO } from "../socket.js";
import { logger } from "../lib/logger.js";

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? "10") / 100;

export const getNearbyVendors = async (req: Request, res: Response) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    if (!lng || !lat) {
      res.status(400).json({ error: "Longitude and latitude are required" });
      return;
    }

    const vendors = await Vendor.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance as string),
          spherical: true,
          query: { isOpen: true },
        },
      },
    ]);
    res.json(vendors);
  } catch (error) {
    logger.error({ error }, "getNearbyVendors error");
    res.status(500).json({ error: "Failed to fetch nearby vendors" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { vendorId, category } = req.query;
    const filter: Record<string, unknown> = {};
    if (vendorId) filter.vendorId = vendorId;
    if (category) filter.category = category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    logger.error({ error }, "getProducts error");
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const toggleVendorStatus = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { isOpen } = req.body;
    const user = req.user!;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    if (user.role !== "admin" && vendor.phone !== user.phone) {
      res.status(403).json({ error: "Forbidden: You do not own this vendor" });
      return;
    }

    vendor.isOpen = isOpen;
    vendor.status = isOpen ? "open" : "closed";
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    logger.error({ error }, "toggleVendorStatus error");
    res.status(500).json({ error: "Failed to update vendor status" });
  }
};

export const toggleProductStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { stockQuantity } = req.body;
    const user = req.user!;

    const product = await Product.findById(productId).populate<{ vendorId: { phone: string } }>("vendorId", "phone");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const vendorPhone = (product.vendorId as any)?.phone;
    if (user.role !== "admin" && vendorPhone !== user.phone) {
      res.status(403).json({ error: "Forbidden: You do not own this product" });
      return;
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = stockQuantity;
      product.isOutOfStock = stockQuantity <= 0;
    } else {
      product.isOutOfStock = !product.isOutOfStock;
      if (product.isOutOfStock) product.stockQuantity = 0;
    }
    await product.save();
    res.json(product);
  } catch (error) {
    logger.error({ error }, "toggleProductStock error");
    res.status(500).json({ error: "Failed to update product stock" });
  }
};

export const advanceOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    order.updateStatus(newStatus);
    await order.save();
    try {
      const io = getIO();
      io.to(`vendor_${order.vendorId.toString()}`).emit("order_status_updated", { orderId, newStatus });
      io.to(`order_${orderId}`).emit("order_status_updated", { orderId, newStatus });
      io.to("admin").emit("order_status_updated", { orderId, newStatus });
    } catch {}
    res.json(order);
  } catch (error) {
    logger.error({ error }, "advanceOrderStatus error");
    res.status(500).json({ error: "Failed to advance order status" });
  }
};

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const canPlace = await user.canPlaceOrder();
    if (!canPlace) {
      res.status(403).json({ error: "Cannot place order. Phone must be verified and fewer than 5 active orders." });
      return;
    }

    const { vendorId, items, customerNote, paymentMethod, userLocation } = req.body;
    if (!vendorId || !userLocation) {
      res.status(400).json({ error: "vendorId and userLocation are required" });
      return;
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isOpen) {
      res.status(400).json({ error: "Vendor is closed or not found" });
      return;
    }

    let totalAmountPaise = 0;
    const resolvedItems: { productId: mongoose.Types.ObjectId; quantity: number }[] = [];

    if (items && items.length > 0) {
      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, vendorId, isOutOfStock: false });

      for (const item of items) {
        const product = products.find((p) => p._id.toString() === item.productId);
        if (!product) {
          res.status(400).json({ error: `Product ${item.productId} not found or unavailable` });
          return;
        }
        totalAmountPaise += product.pricePaise * item.quantity;
        resolvedItems.push({ productId: product._id as mongoose.Types.ObjectId, quantity: item.quantity });
      }
    }

    const order = await Order.create({
      customerId: userId,
      vendorId,
      items: resolvedItems,
      totalAmountPaise,
      customerNote,
      paymentMethod: paymentMethod || "online",
      currentStatus: "pending",
    });

    await Ledger.create({
      orderId: order._id,
      totalAmountPaise,
      paymentMethod: paymentMethod || "online",
      platformFeePaise: Math.round(totalAmountPaise * PLATFORM_FEE_PERCENT),
    });

    try {
      getIO().to(`vendor_${vendorId}`).emit("new_order", {
        orderId: order._id.toString(),
        totalAmount: totalAmountPaise,
        items: order.items,
      });
    } catch {}

    res.status(201).json(order);
  } catch (error) {
    logger.error({ error }, "placeOrder error");
    res.status(500).json({ error: "Failed to place order" });
  }
};

export const completeOrderDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    order.updateStatus("delivered");
    if (riderId) order.partnerId = new mongoose.Types.ObjectId(riderId);
    await order.save();
    res.json({ message: "Order marked as delivered", order });
  } catch (error) {
    logger.error({ error }, "completeOrderDelivery error");
    res.status(500).json({ error: "Failed to complete delivery" });
  }
};

export const getMyVendor = async (req: Request, res: Response) => {
  try {
    const phone = req.user!.phone;
    const vendor = await Vendor.findOne({ phone });
    if (!vendor) {
      res.status(404).json({ error: "No vendor found for this account" });
      return;
    }
    res.json(vendor);
  } catch (error) {
    logger.error({ error }, "getMyVendor error");
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { vendorId, status, limit = "100" } = req.query;

    let resolvedVendorId: string | undefined;

    if (user.role === "admin") {
      resolvedVendorId = vendorId as string | undefined;
    } else {
      const myVendor = await Vendor.findOne({ phone: user.phone }).select("_id");
      if (!myVendor) {
        res.status(404).json({ error: "No vendor found for this account" });
        return;
      }
      resolvedVendorId = myVendor._id.toString();
    }

    const filter: Record<string, unknown> = {};
    if (resolvedVendorId) filter.vendorId = resolvedVendorId;
    if (status) filter.currentStatus = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit as string));
    res.json(orders);
  } catch (error) {
    logger.error({ error }, "getVendorOrders error");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    logger.error({ error }, "getMyOrders error");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getOrderWhatsAppLink = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("vendorId", "phone name");
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const vendor = order.vendorId as any;
    if (!vendor?.phone) {
      res.status(404).json({ error: "Vendor contact information not available" });
      return;
    }

    const rawPhone: string = vendor.phone;
    const normalised = rawPhone.replace(/\D/g, "");
    const phone = normalised.startsWith("91") ? normalised : `91${normalised}`;
    const text = encodeURIComponent(`Hello ${vendor.name}, I am checking on Order #${order._id.toString()}.`);
    res.json({ link: `https://wa.me/${phone}?text=${text}` });
  } catch (error) {
    logger.error({ error }, "getOrderWhatsAppLink error");
    res.status(500).json({ error: "Failed to generate WhatsApp link" });
  }
};
