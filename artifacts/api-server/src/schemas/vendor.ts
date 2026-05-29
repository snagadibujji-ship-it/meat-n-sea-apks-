import { z } from "zod";

export const toggleVendorStatusSchema = z.object({
  isOpen: z.boolean(),
});
