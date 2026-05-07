import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const gradeLevel = searchParams.get("gradeLevel");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = {};

    // Filter by role - parents can only see their children
    if (session.user.role === "parent") {
      query.parentUserId = session.user.id;
    }

    if (search) {
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { lrn: { $regex: search, $options: "i" } },
      ];
    }

    if (gradeLevel) query.currentGradeLevel = gradeLevel;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort({ "personalInfo.lastName": 1, "personalInfo.firstName": 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "registrar"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Duplicate LRN check
    if (body.lrn) {
      const existingLRN = await Student.findOne({ lrn: body.lrn });
      if (existingLRN) {
        return NextResponse.json(
          { error: `LRN ${body.lrn} is already registered to another student.` },
          { status: 409 }
        );
      }
    }

    // Generate student ID
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const studentId = `${year}-${String(count + 1).padStart(5, "0")}`;

    const student = await Student.create({
      ...body,
      studentId,
    });

    return NextResponse.json(
      {
        message: "Student created successfully",
        student,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
