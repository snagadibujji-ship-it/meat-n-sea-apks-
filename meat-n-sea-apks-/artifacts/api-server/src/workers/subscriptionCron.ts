import mongoose from "mongoose";
import StudioSubscription from "../models/StudioSubscription.js";
import Order from "../models/Order.js";
import Ledger from "../models/Ledger.js";
import { logger } from "../lib/logger.js";

export const processSubscriptions = async () => {
  logger.info("Running subscription cron...");
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  try {
    const dueSubscriptions = await StudioSubscription.find({ status: "active", nextDeliveryAt: { $gte: startOfDay, $lte: endOfDay } }).populate("planId");

    logger.info({ count: dueSubscriptions.length }, "Subscriptions due today");

    for (const sub of dueSubscriptions) {
      const plan = sub.planId as any;
      if (!plan) continue;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const Vendor = mongoose.model("Vendor");
        const studioVendor = await Vendor.findOne({ isMnsStudio: true }).session(session);
        if (!studioVendor) throw new Error("No Studio Vendor found");

        const order = await Order.create(
          [{ customerId: sub.userId, vendorId: studioVendor._id, totalAmountPaise: plan.pricePaise, paymentMethod: "online", sourceMode: "studio", deliveryTier: "priority", customerNote: `Studio Box: ${plan.name}` }],
          { session }
        );

        await Ledger.create(
          [{ orderId: order[0]._id, totalAmountPaise: plan.pricePaise, paymentMethod: "online", platformFeePaise: Math.floor((plan.pricePaise * 10) / 100), discountPaise: 0 }],
          { session }
        );

        const nextDate = new Date(sub.nextDeliveryAt);
        nextDate.setDate(nextDate.getDate() + plan.intervalDays);
        sub.nextDeliveryAt = nextDate;
        await sub.save({ session });

        await session.commitTransaction();
        logger.info({ orderId: order[0]._id, subId: sub._id }, "Subscription order generated");
      } catch (err) {
        await session.abortTransaction();
        logger.error({ err, subId: sub._id }, "Failed to process subscription");
      } finally {
        session.endSession();
      }
    }
  } catch (error) {
    logger.error({ error }, "Subscription cron error");
  }
};
