import mongoose, { Document, Schema } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
}

const OtpSchema: Schema = new Schema(
  {
    phone: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: "10m" } },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IOtp>("Otp", OtpSchema);
