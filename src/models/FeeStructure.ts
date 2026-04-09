import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeeStructure extends Document {
  _id: mongoose.Types.ObjectId;
  schoolYearId: mongoose.Types.ObjectId;
  gradeLevel: string;
  fees: {
    description: string;
    amount: number;
    isRequired: boolean;
  }[];
  totalAmount: number;
  paymentOptions: {
    name: string;
    installments: number;
    discount?: number;
  }[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolYearId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolYear",
      required: true,
    },
    gradeLevel: {
      type: String,
      required: [true, "Grade level is required"],
    },
    fees: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        isRequired: { type: Boolean, default: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentOptions: [
      {
        name: { type: String, required: true },
        installments: { type: Number, required: true, min: 1 },
        discount: { type: Number, min: 0, max: 100 },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique grade level per school year
FeeStructureSchema.index({ schoolYearId: 1, gradeLevel: 1 }, { unique: true });
FeeStructureSchema.index({ isActive: 1 });

const FeeStructure: Model<IFeeStructure> =
  mongoose.models.FeeStructure || mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);

export default FeeStructure;
