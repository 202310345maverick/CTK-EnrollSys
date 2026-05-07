import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  schoolName: string;
  schoolShortName: string;
  schoolAddress: string;
  schoolEmail: string;
  schoolPhone: string;
  maxStudentsPerSection: number;
  allowParentSelfRegistration: boolean;
  requireDocumentUploadOnSubmit: boolean;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    schoolName: { type: String, default: "Christ the King Catholic School" },
    schoolShortName: { type: String, default: "CTK" },
    schoolAddress: { type: String, default: "Olongapo City, Zambales" },
    schoolEmail: { type: String, default: "" },
    schoolPhone: { type: String, default: "" },
    maxStudentsPerSection: { type: Number, default: 40 },
    allowParentSelfRegistration: { type: Boolean, default: true },
    requireDocumentUploadOnSubmit: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Singleton pattern — only one settings document
const SystemSettings =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);

export default SystemSettings;
