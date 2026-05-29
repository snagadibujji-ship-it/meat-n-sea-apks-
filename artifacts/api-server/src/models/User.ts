import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  street: string;
  city: string;
  coordinates: number[];
}

export interface IUser extends Document {
  phone: string;
  isPhoneVerified: boolean;
  role: "customer" | "vendor" | "partner" | "admin";
  activeOrdersCount: number;
  maxActiveOrders: number;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  canPlaceOrder: () => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    phone: { type: String, required: true, unique: true },
    isPhoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["customer", "vendor", "partner", "admin"], default: "customer" },
    activeOrdersCount: { type: Number, default: 0 },
    maxActiveOrders: { type: Number, default: 5 },
    addresses: [
      {
        street: { type: String, required: true },
        city: { type: String, default: "" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.methods.canPlaceOrder = async function (): Promise<boolean> {
  if (!this.isPhoneVerified) return false;
  const Order = mongoose.model("Order");
  const activeCount = await Order.countDocuments({
    customerId: this._id,
    currentStatus: { $in: ["pending", "accepted", "preparing", "ready", "out_for_delivery"] },
  });
  return activeCount < this.maxActiveOrders;
};

export default mongoose.model<IUser>("User", UserSchema);
