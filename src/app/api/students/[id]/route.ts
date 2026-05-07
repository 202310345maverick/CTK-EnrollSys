import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import mongoose from "mongoose";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findById(params.id).lean();
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Parents can only view their own children
    if (
      session.user.role === "parent" &&
      student.parentUserId?.toString() !== session.user.id
    ) {
      // SEC-003: parent isolation enforced
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "registrar"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { status, reason } = body;

    const validStatuses = ["active", "inactive", "graduated", "transferred"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: active, inactive, graduated, transferred" },
        { status: 400 }
      );
    }

    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    student.status = status;
    if (!student.statusHistory) {
      student.statusHistory = [];
    }
    student.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(session.user.id),
      reason: reason || undefined,
    });

    await student.save();

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "STUDENT",
      resourceId: params.id,
      details: { status },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Student status updated", student });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
