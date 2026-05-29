import { z } from "zod";

export const createEventSchema = z.object({
  event: z.string().min(1),
  userId: z.string().optional(),
  vendorId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
