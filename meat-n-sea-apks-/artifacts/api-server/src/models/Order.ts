import mongoose, { Schema, Document } from "mongoose";

export interface IStatusTimeline {
  status: "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  timestamp: Date;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  partnerId?: mongoose.Types.ObjectId;
  offeredRiderId?: mongoose.Types.ObjectId;
  items: { productId: mongoose.Types.ObjectId; quantity: number }[];
  totalAmountPaise: number;
  customerNote?: string;
  paymentMethod: "cod" | "online";
  currentStatus: string;
  statusTimeline: IStatusTimeline[];
  sourceMode?: string;
  deliveryTier?: string;
  createdAt: Date;
  updatedAt: Date;
  updateStatus: (newStatus: IStatusTimeline["status"]) => void;
}

const OrderSchema: Schema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Rider" },
    offeredRiderId: { type: Schema.Types.ObjectId, ref: "Rider" },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmountPaise: { type: Number, required: true },
    customerNote: { type: String, maxlength: 250 },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true, default: "online" },
    currentStatus: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    statusTimeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sourceMode: { type: String, default: "bazaar" },
    deliveryTier: { type: String, default: "standard" },
  },
  { timestamps: true }
);

OrderSchema.methods.updateStatus = function (newStatus: IStatusTimeline["status"]) {
  this.currentStatus = newStatus;
  this.statusTimeline.push({ status: newStatus, timestamp: new Date() });
};

OrderSchema.pre("save", function (this: IOrder, next) {
  if (this.isNew && this.statusTimeline.length === 0) {
    this.statusTimeline.push({ status: this.currentStatus as IStatusTimeline["status"], timestamp: new Date() });
  }
  next();
});

export default mongoose.model<IOrder>("Order", OrderSchema);
