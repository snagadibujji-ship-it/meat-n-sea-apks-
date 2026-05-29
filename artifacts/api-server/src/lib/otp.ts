import { logger } from "./logger.js";

export interface OtpSendResult {
  success: boolean;
  message: string;
}

export const sendOtp = async (phone: string, code: string): Promise<OtpSendResult> => {
  if (process.env.NODE_ENV === "development") {
    logger.info({ phone, code }, "DEV MODE: OTP code (not sent via SMS)");
    return { success: true, message: "OTP generated (dev mode)" };
  }

  logger.warn(
    { phone },
    "No OTP provider configured. Set OTP_PROVIDER env var and implement provider. OTP not sent."
  );

  return { success: false, message: "OTP provider not configured" };
};
