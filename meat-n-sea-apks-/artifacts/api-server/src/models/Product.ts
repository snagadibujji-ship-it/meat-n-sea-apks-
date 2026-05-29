import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category?: string;
  pricePaise: number;
  stockQuantity: number;
  isOutOfStock: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    pricePaise: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    isOutOfStock: { type: Boolean, required: true, default: false },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

ProductSchema.pre("save", function (this: IProduct, next) {
  if (this.stockQuantity <= 0) this.isOutOfStock = true;
  next();
});

export default mongoose.model<IProduct>("Product", ProductSchema);
