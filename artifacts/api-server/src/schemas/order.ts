import { z } from "zod";

export const placeOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  userLocation: z.object({
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
  }),
  customerNote: z.string().max(250).optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).optional(),
  paymentMethod: z.enum(["cod", "online"]).default("online"),
});

export const advanceOrderStatusSchema = z.object({
  newStatus: z.enum(["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
});

export const completeDeliverySchema = z.object({
  proofImageUrl: z.string().optional(),
  riderId: z.string().optional(),
});
