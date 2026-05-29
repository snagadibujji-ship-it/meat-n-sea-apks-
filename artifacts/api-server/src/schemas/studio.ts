import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  products: z.array(z.string()).optional(),
  freshnessHours: z.number().int().positive().optional(),
  harvestTime: z.string().optional(),
});

export const updateFreshnessSchema = z.object({
  slug: z.string().min(1),
  freshnessHours: z.number().int().positive(),
  harvestTime: z.string().optional(),
});
