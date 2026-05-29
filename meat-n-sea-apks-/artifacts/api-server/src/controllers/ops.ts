import { Request, Response } from "express";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import mongoose from "mongoose";
import { getIO } from "../socket.js";

export const getNearbyVendors = async (req: Request, res: Response) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    if (!lng || !lat) return res.status(400).json({ error: "Longitude and latitude are required" });

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
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleVendorStatus = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { isOpen } = req.body;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    vendor.isOpen = isOpen;
    vendor.status = isOpen ? "open" : "closed";
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleProductStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { stockQuantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const advanceOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.customerId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const canPlace = await user.canPlaceOrder();
    if (!canPlace) return res.status(403).json({ error: "Cannot place order. Phone must be verified and fewer than 5 active orders." });

    const { vendorId, items, customerNote, paymentMethod, userLocation } = req.body;
    if (!vendorId || !userLocation) return res.status(400).json({ error: "vendorId and userLocation are required" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isOpen) return res.status(400).json({ error: "Vendor is closed or not found" });

    let totalAmountPaise = 0;
    if (items && items.length > 0) {
      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      for (const item of items) {
        const product = products.find((p) => p._id.toString() === item.productId);
        if (product) totalAmountPaise += product.pricePaise * item.quantity;
      }
    }

    const order = await Order.create({
      customerId: userId,
      vendorId,
      items: items || [],
      totalAmountPaise,
      customerNote,
      paymentMethod: paymentMethod || "online",
      currentStatus: "pending",
    });

    await Ledger.create({
      orderId: order._id,
      totalAmountPaise,
      paymentMethod: paymentMethod || "online",
      platformFeePaise: Math.round(totalAmountPaise * 0.1),
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const completeOrderDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.updateStatus("delivered");
    if (riderId) order.partnerId = new mongoose.Types.ObjectId(riderId);
    await order.save();
    res.json({ message: "Order marked as delivered", order });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyVendor = async (req: Request, res: Response) => {
  try {
    const phone = (req as any).user?.phone;
    if (!phone) return res.status(401).json({ error: "Unauthorized" });
    const vendor = await Vendor.findOne({ phone });
    if (!vendor) return res.status(404).json({ error: "No vendor found for this account" });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    const { vendorId, status, limit = "100" } = req.query;
    const filter: Record<string, unknown> = {};
    if (vendorId) filter.vendorId = vendorId;
    if (status) filter.currentStatus = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit as string));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOrderWhatsAppLink = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("vendorId", "phone name");
    if (!order) return res.status(404).json({ error: "Order not found" });

    const vendor = order.vendorId as any;
    if (!vendor?.phone) return res.status(404).json({ error: "Vendor contact information not available" });

    const phone = vendor.phone.startsWith("+91") ? vendor.phone.replace("+91", "91") : `91${vendor.phone}`;
    const text = encodeURIComponent(`Hello ${vendor.name}, I am checking on Order #${order._id.toString()}.`);
    res.json({ link: `https://wa.me/${phone}?text=${text}` });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
