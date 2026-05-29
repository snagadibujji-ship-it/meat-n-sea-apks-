import mongoose, { Schema, Document } from "mongoose";

export interface IRider extends Document {
  userId: mongoose.Types.ObjectId;
  location: { type: "Point"; coordinates: number[] };
  isOnline: boolean;
  status: "available" | "delivering" | "offline";
  lastPing: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RiderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    isOnline: { type: Boolean, default: false },
    status: { type: String, enum: ["available", "delivering", "offline"], default: "offline" },
    lastPing: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RiderSchema.index({ location: "2dsphere" });

export default mongoose.model<IRider>("Rider", RiderSchema);
