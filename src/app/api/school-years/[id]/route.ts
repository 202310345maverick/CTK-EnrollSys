import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import SchoolYear from "@/models/SchoolYear";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const schoolYear = await SchoolYear.findById(params.id).lean();
    if (!schoolYear) {
      return NextResponse.json({ error: "School year not found" }, { status: 404 });
    }

    return NextResponse.json({ schoolYear });
  } catch (error) {
    console.error("Error fetching school year:", error);
    return NextResponse.json({ error: "Failed to fetch school year" }, { status: 500 });
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
    const { name, startDate, endDate, enrollmentPeriod, status, isActive, gradeLevels } = body;

    // If setting this as active, deactivate all others first
    if (isActive) {
      await SchoolYear.updateMany({ _id: { $ne: params.id } }, { isActive: false });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (enrollmentPeriod !== undefined) updateData.enrollmentPeriod = enrollmentPeriod;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (gradeLevels !== undefined) updateData.gradeLevels = gradeLevels;

    const schoolYear = await SchoolYear.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!schoolYear) {
      return NextResponse.json({ error: "School year not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School year updated successfully", schoolYear });
  } catch (error) {
    console.error("Error updating school year:", error);
    return NextResponse.json({ error: "Failed to update school year" }, { status: 500 });
  }
}

export async function PATCH(
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
    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.enrollmentPeriod !== undefined) updateData.enrollmentPeriod = body.enrollmentPeriod;

    const schoolYear = await SchoolYear.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!schoolYear) {
      return NextResponse.json({ error: "School year not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School year updated successfully", schoolYear });
  } catch (error) {
    console.error("Error patching school year:", error);
    return NextResponse.json({ error: "Failed to update school year" }, { status: 500 });
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

    const schoolYear = await SchoolYear.findByIdAndDelete(params.id);
    if (!schoolYear) {
      return NextResponse.json({ error: "School year not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School year deleted successfully" });
  } catch (error) {
    console.error("Error deleting school year:", error);
    return NextResponse.json({ error: "Failed to delete school year" }, { status: 500 });
  }
}
