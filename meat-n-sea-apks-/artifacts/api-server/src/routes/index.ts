import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { requireAuth } from "../middlewares/auth.js";
import rateLimit from "express-rate-limit";

import { requestOtp, verifyOtp } from "../controllers/auth.js";
import { requestOtpSchema, verifyOtpSchema } from "../schemas/auth.js";

import { getNearbyVendors, getProducts, toggleProductStock, advanceOrderStatus, placeOrder, completeOrderDelivery, getOrderWhatsAppLink, toggleVendorStatus, getMyOrders, getMyVendor, getVendorOrders } from "../controllers/ops.js";
import { getMyRider, updateRiderStatus, getRiderOrders } from "../controllers/rider.js";
import { placeOrderSchema, completeDeliverySchema, advanceOrderStatusSchema } from "../schemas/order.js";
import { toggleVendorStatusSchema } from "../schemas/vendor.js";

import { dispatchToNearestRider } from "../controllers/dispatch.js";

import { getDailyReport, getAllVendors, getAllOrders } from "../controllers/admin.js";

import { globalSearch } from "../controllers/search.js";
import { searchSchema } from "../schemas/search.js";

import { addAddress, deleteAddress } from "../controllers/user.js";
import { addAddressSchema } from "../schemas/user.js";

import { createCoupon, getCoupons } from "../controllers/coupon.js";
import { createCouponSchema } from "../schemas/coupon.js";

import { uploadImageMiddleware, uploadMedia } from "../controllers/media.js";

import { getCollections, getCollectionBySlug, getFreshness, getStudioHome, createCollection, updateFreshness } from "../controllers/studio.js";
import { createCollectionSchema, updateFreshnessSchema } from "../schemas/studio.js";

import { getPlans, createSubscription, getMySubscription, updateSubscriptionStatus, createPlan } from "../controllers/subscription.js";
import { createPlanSchema, createSubscriptionSchema, updateSubscriptionSchema } from "../schemas/subscription.js";

import { logEvent, getAnalyticsSummary } from "../controllers/analytics.js";
import { createEventSchema } from "../schemas/analytics.js";

import healthRouter from "./health.js";

const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many OTP requests, try again later" } });

const router = Router();

router.use(healthRouter);

// Auth
router.post("/auth/otp/request", otpLimiter, validateRequest(requestOtpSchema), requestOtp);
router.post("/auth/otp/verify", validateRequest(verifyOtpSchema), verifyOtp);

// Ops
router.get("/vendors/nearby", getNearbyVendors);
router.get("/products", getProducts);
router.patch("/vendors/:vendorId/status", validateRequest(toggleVendorStatusSchema), toggleVendorStatus);
router.post("/products/:productId/toggle-stock", toggleProductStock);
router.post("/orders/:orderId/advance", validateRequest(advanceOrderStatusSchema), advanceOrderStatus);
router.get("/vendors/mine", requireAuth, getMyVendor);
router.get("/orders/mine", requireAuth, getMyOrders);
router.get("/orders/vendor", getVendorOrders);
router.get("/orders/rider", requireAuth, getRiderOrders);
router.get("/riders/mine", requireAuth, getMyRider);
router.put("/riders/mine/status", requireAuth, updateRiderStatus);
router.post("/orders/place", requireAuth, validateRequest(placeOrderSchema), placeOrder);
router.post("/orders/:orderId/complete", validateRequest(completeDeliverySchema), completeOrderDelivery);
router.get("/orders/:orderId/whatsapp-link", getOrderWhatsAppLink);

// Dispatch
router.post("/dispatch/offer", dispatchToNearestRider);

// Admin
router.get("/admin/daily-report", getDailyReport);
router.get("/admin/vendors", getAllVendors);
router.get("/admin/orders", getAllOrders);

// Search
router.get("/search", globalSearch);

// User
router.post("/users/addresses", requireAuth, validateRequest(addAddressSchema), addAddress);
router.delete("/users/addresses/:addressId", requireAuth, deleteAddress);

// Coupons
router.post("/coupons", validateRequest(createCouponSchema), createCoupon);
router.get("/coupons", getCoupons);

// Media
router.post("/upload", uploadImageMiddleware, uploadMedia);

// Studio
router.get("/studio/collections", getCollections);
router.get("/studio/collections/:slug", getCollectionBySlug);
router.get("/studio/freshness", getFreshness);
router.get("/studio/home", getStudioHome);
router.post("/studio/collections", validateRequest(createCollectionSchema), createCollection);
router.post("/studio/freshness", validateRequest(updateFreshnessSchema), updateFreshness);

// Subscriptions
router.get("/studio/plans", getPlans);
router.post("/studio/plans", validateRequest(createPlanSchema), createPlan);
router.post("/studio/subscriptions", validateRequest(createSubscriptionSchema), createSubscription);
router.get("/studio/subscriptions/me", getMySubscription);
router.patch("/studio/subscriptions/:id", validateRequest(updateSubscriptionSchema), updateSubscriptionStatus);

// Analytics
router.post("/analytics/event", validateRequest(createEventSchema), logEvent);
router.get("/analytics/summary", getAnalyticsSummary);

export default router;
