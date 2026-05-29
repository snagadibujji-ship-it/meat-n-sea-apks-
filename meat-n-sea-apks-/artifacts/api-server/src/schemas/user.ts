import { z } from "zod";

export const addAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().optional(),
  coordinates: z.array(z.number()).length(2).optional(),
});
