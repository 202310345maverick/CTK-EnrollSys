import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  enrollmentNumber: string;
  studentId?: mongoose.Types.ObjectId;
  schoolYearId?: mongoose.Types.ObjectId;
  enrollmentType?: "new" | "old" | "transferee" | "returning";
  gradeLevel?: string;
  previousSchool?: {
    name: string;
    address: string;
    lastGradeCompleted: string;
    schoolYear: string;
  };
  status: "draft" | "pending" | "under_review" | "approved" | "rejected" | "enrolled";
  isDraft: boolean;
  draftData?: Record<string, unknown>;
  statusHistory: {
    status: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    remarks?: string;
  }[];
  documents: {
    type: "psa_birth_certificate" | "report_card" | "id_photo" | "good_moral" | "transfer_certificate" | "non_catholic_agreement" | "other";
    documentId: mongoose.Types.ObjectId;
    status: "pending" | "verified" | "rejected";
    remarks?: string;
  }[];
  assessedFees?: {
    feeStructureId: mongoose.Types.ObjectId;
    totalAmount: number;
    breakdown: {
      description: string;
      amount: number;
    }[];
  };
  submittedBy: mongoose.Types.ObjectId;
  submittedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  enrollmentDate?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    schoolYearId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolYear",
    },
    enrollmentType: {
      type: String,
      enum: ["new", "old", "transferee", "returning"],
    },
    gradeLevel: {
      type: String,
    },
    previousSchool: {
      name: String,
      address: String,
      lastGradeCompleted: String,
      schoolYear: String,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "under_review", "approved", "rejected", "enrolled"],
      default: "pending",
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    draftData: {
      type: Schema.Types.Mixed,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        changedAt: { type: Date, default: Date.now },
        remarks: String,
      },
    ],
    documents: [
      {
        type: {
          type: String,
          enum: [
            "psa_birth_certificate",
            "report_card",
            "id_photo",
            "good_moral",
            "transfer_certificate",
            "non_catholic_agreement",
            "other",
          ],
          required: true,
        },
        documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        remarks: String,
      },
    ],
    assessedFees: {
      feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure" },
      totalAmount: Number,
      breakdown: [
        {
          description: String,
          amount: Number,
        },
      ],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: Date,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    enrollmentDate: Date,
    remarks: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
EnrollmentSchema.index({ studentId: 1 });
EnrollmentSchema.index({ schoolYearId: 1 });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ submittedBy: 1 });
EnrollmentSchema.index({ isDraft: 1 });
EnrollmentSchema.index({ gradeLevel: 1 });
EnrollmentSchema.index({ createdAt: -1 });
EnrollmentSchema.index({ submittedBy: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, schoolYearId: 1 });
EnrollmentSchema.index({ schoolYearId: 1, gradeLevel: 1 });

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);

export default Enrollment;
