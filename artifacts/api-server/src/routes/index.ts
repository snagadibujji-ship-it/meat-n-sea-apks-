import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../middlewares/validateRequest.js";
import { requireAuth, requireAdmin, requireVendorOrAdmin, requireRiderOrAdmin } from "../middlewares/auth.js";

import { requestOtp, verifyOtp } from "../controllers/auth.js";
import { requestOtpSchema, verifyOtpSchema } from "../schemas/auth.js";

import {
  getNearbyVendors,
  getProducts,
  toggleProductStock,
  advanceOrderStatus,
  placeOrder,
  completeOrderDelivery,
  getOrderWhatsAppLink,
  toggleVendorStatus,
  getMyOrders,
  getMyVendor,
  getVendorOrders,
} from "../controllers/ops.js";
import { getMyRider, updateRiderStatus, getRiderOrders } from "../controllers/rider.js";
import { placeOrderSchema, completeDeliverySchema, advanceOrderStatusSchema } from "../schemas/order.js";
import { toggleVendorStatusSchema } from "../schemas/vendor.js";

import { dispatchToNearestRider } from "../controllers/dispatch.js";

import { getDailyReport, getAllVendors, getAllOrders } from "../controllers/admin.js";

import { globalSearch } from "../controllers/search.js";

import { addAddress, deleteAddress } from "../controllers/user.js";
import { addAddressSchema } from "../schemas/user.js";

import { createCoupon, getCoupons } from "../controllers/coupon.js";
import { createCouponSchema } from "../schemas/coupon.js";

import { uploadImageMiddleware, uploadMedia } from "../controllers/media.js";

import {
  getCollections,
  getCollectionBySlug,
  getFreshness,
  getStudioHome,
  createCollection,
  updateFreshness,
} from "../controllers/studio.js";
import { createCollectionSchema, updateFreshnessSchema } from "../schemas/studio.js";

import {
  getPlans,
  createPlan,
  createSubscription,
  getMySubscription,
  updateSubscriptionStatus,
} from "../controllers/subscription.js";
import { createPlanSchema, createSubscriptionSchema, updateSubscriptionSchema } from "../schemas/subscription.js";

import { logEvent, getAnalyticsSummary } from "../controllers/analytics.js";
import { createEventSchema } from "../schemas/analytics.js";

import healthRouter from "./health.js";

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many OTP requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many upload requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(healthRouter);

// ─── Auth (public) ───────────────────────────────────────────────────────────
router.post("/auth/otp/request", otpLimiter, validateRequest(requestOtpSchema), requestOtp);
router.post("/auth/otp/verify", validateRequest(verifyOtpSchema), verifyOtp);

// ─── Public read-only ops ─────────────────────────────────────────────────────
router.get("/vendors/nearby", getNearbyVendors);
router.get("/products", getProducts);
router.get("/search", globalSearch);
router.get("/coupons", getCoupons);

// ─── Studio public reads ──────────────────────────────────────────────────────
router.get("/studio/collections", getCollections);
router.get("/studio/collections/:slug", getCollectionBySlug);
router.get("/studio/freshness", getFreshness);
router.get("/studio/home", getStudioHome);
router.get("/studio/plans", getPlans);

// ─── Customer routes (any authenticated user) ────────────────────────────────
router.get("/orders/mine", requireAuth, getMyOrders);
router.post("/orders/place", requireAuth, orderLimiter, validateRequest(placeOrderSchema), placeOrder);
router.get("/orders/:orderId/whatsapp-link", requireAuth, getOrderWhatsAppLink);
router.post("/users/addresses", requireAuth, validateRequest(addAddressSchema), addAddress);
router.delete("/users/addresses/:addressId", requireAuth, deleteAddress);
router.post("/studio/subscriptions", requireAuth, validateRequest(createSubscriptionSchema), createSubscription);
router.get("/studio/subscriptions/me", requireAuth, getMySubscription);
router.patch("/studio/subscriptions/:id", requireAuth, validateRequest(updateSubscriptionSchema), updateSubscriptionStatus);

// ─── Analytics event logging (any authenticated user) ─────────────────────────
router.post("/analytics/event", requireAuth, validateRequest(createEventSchema), logEvent);

// ─── Vendor routes (vendor or admin) ─────────────────────────────────────────
router.get("/vendors/mine", ...requireVendorOrAdmin, getMyVendor);
router.get("/orders/vendor", ...requireVendorOrAdmin, getVendorOrders);
router.patch("/vendors/:vendorId/status", ...requireVendorOrAdmin, validateRequest(toggleVendorStatusSchema), toggleVendorStatus);
router.post("/products/:productId/toggle-stock", ...requireVendorOrAdmin, toggleProductStock);
router.post("/orders/:orderId/advance", ...requireVendorOrAdmin, validateRequest(advanceOrderStatusSchema), advanceOrderStatus);

// ─── Rider routes (partner or admin) ─────────────────────────────────────────
router.get("/orders/rider", ...requireRiderOrAdmin, getRiderOrders);
router.get("/riders/mine", ...requireRiderOrAdmin, getMyRider);
router.put("/riders/mine/status", ...requireRiderOrAdmin, updateRiderStatus);
router.post("/orders/:orderId/complete", ...requireRiderOrAdmin, validateRequest(completeDeliverySchema), completeOrderDelivery);

// ─── Dispatch (admin only — internal operation) ───────────────────────────────
router.post("/dispatch/offer", ...requireAdmin, dispatchToNearestRider);

// ─── Admin routes (admin only) ────────────────────────────────────────────────
router.get("/admin/daily-report", ...requireAdmin, getDailyReport);
router.get("/admin/vendors", ...requireAdmin, getAllVendors);
router.get("/admin/orders", ...requireAdmin, getAllOrders);
router.get("/analytics/summary", ...requireAdmin, getAnalyticsSummary);
router.post("/coupons", ...requireAdmin, validateRequest(createCouponSchema), createCoupon);
router.post("/studio/collections", ...requireAdmin, validateRequest(createCollectionSchema), createCollection);
router.post("/studio/freshness", ...requireAdmin, validateRequest(updateFreshnessSchema), updateFreshness);
router.post("/studio/plans", ...requireAdmin, validateRequest(createPlanSchema), createPlan);

// ─── Media upload (any authenticated user) ───────────────────────────────────
router.post("/upload", requireAuth, uploadLimiter, uploadImageMiddleware, uploadMedia);

export default router;
