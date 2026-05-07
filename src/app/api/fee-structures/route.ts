import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import FeeStructure from "@/models/FeeStructure";
import "@/models/SchoolYear";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "registrar")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const schoolYearId = searchParams.get("schoolYearId");

    const query: Record<string, unknown> = {};
    if (schoolYearId) query.schoolYearId = schoolYearId;

    const feeStructures = await FeeStructure.find(query)
      .populate("schoolYearId", "name startDate endDate")
      .sort({ gradeLevel: 1 })
      .lean();

    return NextResponse.json({ feeStructures });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { schoolYearId, gradeLevel, fees, totalAmount, paymentOptions, isActive } = body;

    const feeStructure = await FeeStructure.create({
      schoolYearId,
      gradeLevel,
      fees: fees || [],
      totalAmount: totalAmount || 0,
      paymentOptions: paymentOptions || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: session.user.id,
    });

    void createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "FEE_STRUCTURE",
      resourceId: feeStructure._id.toString(),
      details: { gradeLevel, totalAmount: feeStructure.totalAmount },
    });

    return NextResponse.json(
      { message: "Fee structure created successfully", feeStructure },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating fee structure:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A fee structure for this grade level already exists for the selected school year" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create fee structure" }, { status: 500 });
  }
}
