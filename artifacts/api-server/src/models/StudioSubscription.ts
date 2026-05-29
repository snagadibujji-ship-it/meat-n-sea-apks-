import mongoose, { Schema, Document } from "mongoose";

export interface IStudioSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: "active" | "paused" | "cancelled";
  deliveryDay: string;
  deliveryAddress: { street: string; coordinates: number[] };
  nextDeliveryAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudioSubscriptionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "StudioPlan", required: true },
    status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    deliveryDay: { type: String, required: true },
    deliveryAddress: {
      street: { type: String, required: true },
      coordinates: { type: [Number], required: true },
    },
    nextDeliveryAt: { type: Date, required: true },
  },
  { timestamps: true }
);

StudioSubscriptionSchema.index({ status: 1, nextDeliveryAt: 1 });

export default mongoose.model<IStudioSubscription>("StudioSubscription", StudioSubscriptionSchema);
