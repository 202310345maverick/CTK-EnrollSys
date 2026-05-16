import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  type: "psa_birth_certificate" | "report_card" | "id_photo" | "good_moral" | "transfer_certificate" | "non_catholic_agreement" | "other";
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  secureUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
    },
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
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationNote: {
      type: String,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentSchema.index({ studentId: 1 });
DocumentSchema.index({ enrollmentId: 1 });
DocumentSchema.index({ type: 1 });

const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
