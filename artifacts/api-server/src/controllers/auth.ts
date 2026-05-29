import { Request, Response } from "express";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import { generateToken } from "../middlewares/auth.js";
import { sendOtp } from "../lib/otp.js";
import { logger } from "../lib/logger.js";

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ phone, code, expiresAt });

    const result = await sendOtp(phone, code);

    if (process.env.NODE_ENV === "development") {
      res.json({ message: "OTP sent successfully", devOtp: code });
      return;
    }

    if (!result.success) {
      logger.warn({ phone }, "OTP provider unavailable — OTP created but not delivered");
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    logger.error({ error }, "requestOtp error");
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: "Phone and code are required" });
      return;
    }

    const otpRecord = await Otp.findOne({
      phone,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, isPhoneVerified: true });
    } else if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    const token = generateToken({ id: user._id.toString(), role: user.role, phone: user.phone });
    res.json({ message: "Login successful", userId: user._id, role: user.role, token });
  } catch (error) {
    logger.error({ error }, "verifyOtp error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};
