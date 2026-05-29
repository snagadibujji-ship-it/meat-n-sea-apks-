import mongoose, { Schema, Document } from "mongoose";

export interface IAnalyticsEvent extends Document {
  event: string;
  userId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AnalyticsEventSchema: Schema = new Schema(
  {
    event: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);
