import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  freshnessHours?: number;
  harvestTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    freshnessHours: { type: Number, default: 24 },
    harvestTime: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICollection>("Collection", CollectionSchema);
