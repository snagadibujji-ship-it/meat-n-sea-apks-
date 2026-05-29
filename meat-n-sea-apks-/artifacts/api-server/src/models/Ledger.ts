import mongoose, { Schema, Document } from "mongoose";

export interface ILedger extends Document {
  orderId: mongoose.Types.ObjectId;
  totalAmountPaise: number;
  paymentMethod: "cod" | "online";
  cashCollectedBy: "platform" | "rider";
  platformFeePaise?: number;
  discountPaise?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    totalAmountPaise: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    cashCollectedBy: { type: String, enum: ["platform", "rider"], required: true, default: "platform" },
    platformFeePaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LedgerSchema.pre("validate", function (next) {
  if (this.paymentMethod === "cod") this.cashCollectedBy = "rider";
  next();
});

export default mongoose.model<ILedger>("Ledger", LedgerSchema);
