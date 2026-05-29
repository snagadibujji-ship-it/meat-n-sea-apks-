import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});
