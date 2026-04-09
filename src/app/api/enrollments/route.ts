import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import SchoolYear from "@/models/SchoolYear";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const gradeLevel = searchParams.get("gradeLevel");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = {};

    // Filter by role
    if (session.user.role === "parent") {
      query.submittedBy = session.user.id;
    }

    if (status) query.status = status;
    if (gradeLevel) query.gradeLevel = gradeLevel;

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate("studentId", "personalInfo studentId")
        .populate("schoolYearId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(query),
    ]);

    return NextResponse.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Get active school year
    const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
    if (!activeSchoolYear) {
      return NextResponse.json(
        { error: "No active school year found" },
        { status: 400 }
      );
    }

    // Check if enrollment period is open
    const now = new Date();
    if (
      now < activeSchoolYear.enrollmentPeriod.start ||
      now > activeSchoolYear.enrollmentPeriod.end
    ) {
      return NextResponse.json(
        { error: "Enrollment period is not open" },
        { status: 400 }
      );
    }

    // Generate student ID
    const studentCount = await Student.countDocuments();
    const studentId = generateId("STU", studentCount + 1);

    // Create student record
    const student = await Student.create({
      studentId,
      lrn: body.lrn || undefined,
      personalInfo: {
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        suffix: body.suffix,
        birthDate: new Date(body.birthDate),
        birthPlace: body.birthPlace,
        gender: body.gender,
        nationality: body.nationality || "Filipino",
        religion: body.religion,
      },
      contactInfo: {
        address: {
          street: body.street,
          barangay: body.barangay,
          city: body.city,
          province: body.province,
          zipCode: body.zipCode,
        },
      },
      guardianInfo: {
        father: body.fatherName
          ? {
              fullName: body.fatherName,
              occupation: body.fatherOccupation,
              contactNumber: body.fatherContact,
            }
          : undefined,
        mother: body.motherName
          ? {
              fullName: body.motherName,
              occupation: body.motherOccupation,
              contactNumber: body.motherContact,
            }
          : undefined,
        guardian: body.guardianName
          ? {
              fullName: body.guardianName,
              relationship: body.guardianRelationship,
              contactNumber: body.guardianContact,
            }
          : undefined,
      },
      parentUserId: session.user.id,
      status: "active",
    });

    // Generate enrollment number
    const enrollmentCount = await Enrollment.countDocuments();
    const enrollmentNumber = generateId("ENR", enrollmentCount + 1);

    // Create enrollment record
    const enrollment = await Enrollment.create({
      enrollmentNumber,
      studentId: student._id,
      schoolYearId: activeSchoolYear._id,
      enrollmentType: body.enrollmentType,
      gradeLevel: body.gradeLevel,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          changedBy: session.user.id,
          changedAt: new Date(),
          remarks: "Application submitted",
        },
      ],
      documents: [],
      submittedBy: session.user.id,
    });

    // Update student with enrollment reference
    await Student.findByIdAndUpdate(student._id, {
      $push: { enrollmentHistory: enrollment._id },
      currentGradeLevel: body.gradeLevel,
    });

    return NextResponse.json(
      {
        message: "Enrollment submitted successfully",
        enrollment: {
          id: enrollment._id,
          enrollmentNumber: enrollment.enrollmentNumber,
          status: enrollment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}
