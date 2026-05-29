import Order from "../models/Order.js";
import { redisClient } from "../lib/redis.js";
import { logger } from "../lib/logger.js";

export const startDispatchPollWorker = () => {
  setInterval(async () => {
    try {
      const pendingOrders = await Order.find({ currentStatus: "pending", offeredRiderId: { $exists: true } });
      for (const order of pendingOrders) {
        const redisKey = `dispatch:${order._id.toString()}`;
        const activeOffer = await redisClient.get(redisKey);
        if (!activeOffer) {
          order.offeredRiderId = undefined;
          await order.save();
          logger.info({ orderId: order._id }, "Dispatch offer expired, unlocked for re-dispatch");
        }
      }
    } catch (err) {
      logger.error({ err }, "Dispatch poll worker error");
    }
  }, 30000);

  logger.info("Dispatch poll worker started (30s interval)");
};

export const checkSlaBreaches = async () => {
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const breachedOrders = await Order.find({ sourceMode: "studio", currentStatus: "pending", createdAt: { $lt: fiveMinsAgo } });
    if (breachedOrders.length > 0) {
      logger.warn({ count: breachedOrders.length }, "SLA breach: unassigned Studio orders");
    }
  } catch (err) {
    logger.error({ err }, "SLA breach check error");
  }
};
