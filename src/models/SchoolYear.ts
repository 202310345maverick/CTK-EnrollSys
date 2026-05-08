import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchoolYear extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  enrollmentPeriod: {
    start: Date;
    end: Date;
  };
  gradeLevels: string[];
  status: "upcoming" | "enrollment" | "ongoing" | "completed";
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolYearSchema = new Schema<ISchoolYear>(
  {
    name: {
      type: String,
      required: [true, "School year name is required"],
      unique: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    enrollmentPeriod: {
      start: {
        type: Date,
        required: [true, "Enrollment start date is required"],
      },
      end: {
        type: Date,
        required: [true, "Enrollment end date is required"],
      },
    },
    gradeLevels: {
      type: [String],
      default: [
        "Pre-Kindergarten",
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
      ],
    },
    status: {
      type: String,
      enum: ["upcoming", "enrollment", "ongoing", "completed"],
      default: "upcoming",
    },
    isActive: {
      type: Boolean,
      default: false,
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

// Indexes
SchoolYearSchema.index({ name: 1 });
SchoolYearSchema.index({ isActive: 1 });
SchoolYearSchema.index({ status: 1 });

const SchoolYear: Model<ISchoolYear> =
  mongoose.models.SchoolYear || mongoose.model<ISchoolYear>("SchoolYear", SchoolYearSchema);

export default SchoolYear;
