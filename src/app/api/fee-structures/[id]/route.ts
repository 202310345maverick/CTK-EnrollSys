import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import FeeStructure from "@/models/FeeStructure";
import "@/models/SchoolYear";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "registrar")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const feeStructure = await FeeStructure.findById(params.id)
      .populate("schoolYearId", "name startDate endDate")
      .lean();

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    return NextResponse.json({ feeStructure });
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return NextResponse.json({ error: "Failed to fetch fee structure" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { schoolYearId, gradeLevel, fees, totalAmount, paymentOptions, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (schoolYearId !== undefined) updateData.schoolYearId = schoolYearId;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (fees !== undefined) updateData.fees = fees;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (paymentOptions !== undefined) updateData.paymentOptions = paymentOptions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const feeStructure = await FeeStructure.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("schoolYearId", "name startDate endDate");

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "FEE_STRUCTURE",
      resourceId: params.id,
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ message: "Fee structure updated successfully", feeStructure });
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return NextResponse.json({ error: "Failed to update fee structure" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const feeStructure = await FeeStructure.findByIdAndDelete(params.id);
    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "FEE_STRUCTURE",
      resourceId: params.id,
      details: { gradeLevel: feeStructure.gradeLevel },
    });

    return NextResponse.json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return NextResponse.json({ error: "Failed to delete fee structure" }, { status: 500 });
  }
}
