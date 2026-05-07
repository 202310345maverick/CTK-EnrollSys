import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const enrollmentId = searchParams.get("enrollmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const includeVoided = searchParams.get("includeVoided") === "true";
    const query: Record<string, unknown> = includeVoided ? {} : { isVoided: false };

    if (session.user.role === "parent") {
      const students = await Student.find({ parentUserId: session.user.id })
        .select("_id")
        .lean();
      const parentStudentIds = students.map((student) => student._id.toString());

      if (parentStudentIds.length === 0) {
        return NextResponse.json({
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      if (studentId && !parentStudentIds.includes(studentId)) {
        return NextResponse.json({
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      query.studentId = studentId ? studentId : { $in: parentStudentIds };
    }

    if (studentId && session.user.role !== "parent") query.studentId = studentId;
    if (enrollmentId) query.enrollmentId = enrollmentId;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("studentId", "personalInfo studentId")
        .populate("receivedBy", "profile.firstName profile.lastName")
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
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

    // Generate receipt number
    const paymentCount = await Payment.countDocuments();
    const receiptNumber = generateId("OR", paymentCount + 1);

    const payment = await Payment.create({
      ...body,
      receiptNumber,
      receivedBy: session.user.id,
      isVoided: false,
    });

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
