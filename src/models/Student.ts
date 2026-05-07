import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: string;
  lrn?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    birthDate: Date;
    birthPlace: string;
    gender: "male" | "female";
    nationality: string;
    religion?: string;
    motherTongue?: string;
  };
  contactInfo: {
    address: {
      street: string;
      barangay: string;
      city: string;
      province: string;
      zipCode: string;
    };
    contactNumber?: string;
    email?: string;
  };
  guardianInfo: {
    father?: {
      fullName: string;
      occupation?: string;
      contactNumber?: string;
      email?: string;
    };
    mother?: {
      fullName: string;
      occupation?: string;
      contactNumber?: string;
      email?: string;
    };
    guardian?: {
      fullName: string;
      relationship: string;
      occupation?: string;
      contactNumber: string;
      email?: string;
    };
  };
  parentUserId?: mongoose.Types.ObjectId;
  currentGradeLevel?: string;
  section?: string;
  status: "active" | "inactive" | "graduated" | "transferred";
  enrollmentHistory: mongoose.Types.ObjectId[];
  statusHistory: {
    status: "active" | "inactive" | "graduated" | "transferred";
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    reason?: string;
  }[];
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    conditions?: string[];
    emergencyContact: {
      name: string;
      relationship: string;
      contactNumber: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    lrn: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\d{12}$/.test(v);
        },
        message: "LRN must be exactly 12 digits",
      },
    },
    personalInfo: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
      },
      middleName: { type: String, trim: true },
      suffix: { type: String, trim: true },
      birthDate: {
        type: Date,
        required: [true, "Birth date is required"],
      },
      birthPlace: {
        type: String,
        required: [true, "Birth place is required"],
      },
      gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Gender is required"],
      },
      nationality: {
        type: String,
        default: "Filipino",
      },
      religion: String,
      motherTongue: String,
    },
    contactInfo: {
      address: {
        street: { type: String, required: true },
        barangay: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        zipCode: { type: String, required: true },
      },
      contactNumber: String,
      email: String,
    },
    guardianInfo: {
      father: {
        fullName: String,
        occupation: String,
        contactNumber: String,
        email: String,
      },
      mother: {
        fullName: String,
        occupation: String,
        contactNumber: String,
        email: String,
      },
      guardian: {
        fullName: String,
        relationship: String,
        occupation: String,
        contactNumber: String,
        email: String,
      },
    },
    parentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    currentGradeLevel: String,
    section: String,
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    enrollmentHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Enrollment",
      },
    ],
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["active", "inactive", "graduated", "transferred"],
          required: true,
        },
        changedAt: { type: Date, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reason: { type: String },
      },
    ],
    medicalInfo: {
      bloodType: String,
      allergies: [String],
      conditions: [String],
      emergencyContact: {
        name: String,
        relationship: String,
        contactNumber: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StudentSchema.index({ "personalInfo.lastName": 1, "personalInfo.firstName": 1 });
StudentSchema.index({ parentUserId: 1 });
StudentSchema.index({ currentGradeLevel: 1 });
StudentSchema.index({ status: 1 });
// Note: lrn index is defined inline on the field (unique: true, sparse: true)

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
