import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  phone: string;
  location: { type: "Point"; coordinates: number[] };
  isOpen: boolean;
  status: "open" | "busy" | "closed";
  serviceRadiusKm: number;
  fssaiNumber?: string;
  isMnsStudio?: boolean;
  businessHours?: { openTime: string; closeTime: string };
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    isOpen: { type: Boolean, default: true },
    status: { type: String, enum: ["open", "busy", "closed"], default: "open" },
    serviceRadiusKm: { type: Number, default: 5 },
    fssaiNumber: { type: String },
    isMnsStudio: { type: Boolean, default: false },
    businessHours: {
      openTime: { type: String },
      closeTime: { type: String },
    },
  },
  { timestamps: true }
);

VendorSchema.index({ location: "2dsphere" });

export default mongoose.model<IVendor>("Vendor", VendorSchema);
