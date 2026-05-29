import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ phone, code, expiresAt });

    // For testing: return OTP in dev mode
    if (process.env.NODE_ENV === "development") {
      return res.json({ message: "OTP sent successfully", devOtp: code });
    }
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "Phone and code are required" });

    const otpRecord = await Otp.findOne({ phone, code, isUsed: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ error: "Invalid or expired OTP" });

    otpRecord.isUsed = true;
    await otpRecord.save();

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, isPhoneVerified: true });
    } else if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", userId: user._id, role: user.role, token });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
