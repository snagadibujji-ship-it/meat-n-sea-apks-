import mongoose, { Schema, Document } from "mongoose";

export interface IStudioPlan extends Document {
  name: string;
  description: string;
  pricePaise: number;
  intervalDays: number;
  curatedItems: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudioPlanSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    pricePaise: { type: Number, required: true },
    intervalDays: { type: Number, required: true, default: 7 },
    curatedItems: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStudioPlan>("StudioPlan", StudioPlanSchema);
