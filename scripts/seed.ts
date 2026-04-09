import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable");
  process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "registrar", "parent"], default: "parent" },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      middleName: String,
      contactNumber: { type: String, required: true },
      address: String,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// School Year Schema
const SchoolYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    enrollmentPeriod: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    gradeLevels: [String],
    status: { type: String, enum: ["upcoming", "enrollment", "ongoing", "completed"], default: "upcoming" },
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SchoolYear = mongoose.models.SchoolYear || mongoose.model("SchoolYear", SchoolYearSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create admin user
    const adminEmail = "admin@ctkschool.edu.ph";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("CTKAdmin2026", 12);
      const admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        profile: {
          firstName: "System",
          lastName: "Administrator",
          contactNumber: "09171234567",
          address: "Christ the King Catholic School, Olongapo City",
        },
        isActive: true,
        isEmailVerified: true,
      });
      console.log("Admin user created:", admin.email);
    } else {
      console.log("Admin user already exists");
    }

    // Create registrar user
    const registrarEmail = "registrar@ctkschool.edu.ph";
    const existingRegistrar = await User.findOne({ email: registrarEmail });

    if (!existingRegistrar) {
      const hashedPassword = await bcrypt.hash("CTKRegistrar2026", 12);
      const registrar = await User.create({
        email: registrarEmail,
        password: hashedPassword,
        role: "registrar",
        profile: {
          firstName: "School",
          lastName: "Registrar",
          contactNumber: "09179876543",
          address: "Christ the King Catholic School, Olongapo City",
        },
        isActive: true,
        isEmailVerified: true,
      });
      console.log("Registrar user created:", registrar.email);
    } else {
      console.log("Registrar user already exists");
    }

    // Create current school year
    const admin = await User.findOne({ role: "admin" });
    const currentYear = new Date().getFullYear();
    const schoolYearName = `${currentYear}-${currentYear + 1}`;
    const existingSchoolYear = await SchoolYear.findOne({ name: schoolYearName });

    if (!existingSchoolYear) {
      const schoolYear = await SchoolYear.create({
        name: schoolYearName,
        startDate: new Date(`${currentYear}-08-05`),
        endDate: new Date(`${currentYear + 1}-05-30`),
        enrollmentPeriod: {
          start: new Date(`${currentYear}-03-01`),
          end: new Date(`${currentYear}-07-31`),
        },
        gradeLevels: [
          "Nursery",
          "Kinder 1",
          "Kinder 2",
          "Grade 1",
          "Grade 2",
          "Grade 3",
          "Grade 4",
          "Grade 5",
          "Grade 6",
        ],
        status: "enrollment",
        isActive: true,
        createdBy: admin?._id,
      });
      console.log("School year created:", schoolYear.name);
    } else {
      console.log("School year already exists");
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
