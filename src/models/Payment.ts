import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  schoolYearId: mongoose.Types.ObjectId;
  paymentType: "tuition" | "miscellaneous" | "other";
  description: string;
  amount: number;
  paymentMethod: "cash";
  receivedBy: mongoose.Types.ObjectId;
  paymentDate: Date;
  remarks?: string;
  isVoided: boolean;
  voidedBy?: mongoose.Types.ObjectId;
  voidedAt?: Date;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    schoolYearId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolYear",
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["tuition", "miscellaneous", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash"],
      required: true,
      default: "cash",
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    remarks: String,
    isVoided: {
      type: Boolean,
      default: false,
    },
    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    voidedAt: Date,
    voidReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ receiptNumber: 1 });
PaymentSchema.index({ enrollmentId: 1 });
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ schoolYearId: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ isVoided: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
