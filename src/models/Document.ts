import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIAnalysis {
  status: "passed" | "flagged" | "needs_review" | "skipped" | "error";
  extractedText?: string;
  confidence?: number;
  documentTypeDetected?: string | null;
  documentTypeMatch?: boolean | null;
  studentNameFound?: boolean | null;
  qualityFlags?: string[];
  analyzedAt?: Date;
  error?: string;
}

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
  aiAnalysis?: IAIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    status: {
      type: String,
      enum: ["passed", "flagged", "needs_review", "skipped", "error"],
    },
    extractedText: { type: String },
    confidence: { type: Number },
    documentTypeDetected: { type: String, default: null },
    documentTypeMatch: { type: Boolean, default: null },
    studentNameFound: { type: Boolean, default: null },
    qualityFlags: [{ type: String }],
    analyzedAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

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
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    secureUrl: { type: String, required: true },
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
    verificationNote: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    aiAnalysis: { type: AIAnalysisSchema },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ studentId: 1 });
DocumentSchema.index({ enrollmentId: 1 });
DocumentSchema.index({ type: 1 });

const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
