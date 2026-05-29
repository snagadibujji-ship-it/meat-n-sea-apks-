import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discountPaise: z.number().int().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  maxUsage: z.number().int().positive().default(100),
  expiresAt: z.string(),
});
