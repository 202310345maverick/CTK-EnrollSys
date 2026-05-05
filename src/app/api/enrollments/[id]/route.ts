import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Document from "@/models/Document";

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

    const enrollment = await Enrollment.findById(params.id)
      .populate("studentId")
      .populate("schoolYearId", "name")
      .populate("statusHistory.changedBy", "profile.firstName profile.lastName email role")
      .populate("documents.documentId", "secureUrl originalName fileName createdAt")
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check authorization - parents can only view their own
    if (session.user.role === "parent" && enrollment.submittedBy?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json({ error: "Failed to fetch enrollment" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findById(params.id);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check authorization
    const isAdmin = session.user.role === "admin" || session.user.role === "registrar";
    const isOwner = session.user.role === "parent" && enrollment.submittedBy?.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (isOwner && !enrollment.isDraft && enrollment.status !== "pending") {
      return NextResponse.json(
        { error: "Cannot modify enrollment after it has been reviewed" },
        { status: 400 }
      );
    }

    // Admin/registrar can update status
    if (isAdmin && body.status) {
      enrollment.status = body.status;
      enrollment.statusHistory.push({
        status: body.status,
        changedBy: new Types.ObjectId(session.user.id),
        changedAt: new Date(),
        remarks: body.remarks || `Status changed to ${body.status}`,
      });

      // If approved, assign section if provided
      if (body.status === "approved" && body.section) {
        await Student.findByIdAndUpdate(enrollment.studentId, {
          section: body.section,
        });
      }
    }

    // Admin/registrar can update assessed fees
    if (isAdmin && body.assessedFees) {
      enrollment.assessedFees = body.assessedFees;
    }

    // Admin/registrar can update individual document status
    if (isAdmin && body.documentUpdate) {
      const { documentType, status: docStatus, remarks: docRemarks } = body.documentUpdate;
      const docIndex = enrollment.documents.findIndex((d: any) => d.type === documentType);
      if (docIndex !== -1) {
        enrollment.documents[docIndex].status = docStatus;
        if (docRemarks) enrollment.documents[docIndex].remarks = docRemarks;
        enrollment.markModified("documents");
      }
    }

    if (isOwner && enrollment.isDraft && body.draftData) {
      enrollment.draftData = body.draftData;
      enrollment.enrollmentType = body.draftData?.enrollmentType || enrollment.enrollmentType;
      enrollment.gradeLevel = body.draftData?.gradeLevel || enrollment.gradeLevel;
      enrollment.status = "draft";
    }

    // Update documents if provided
    if (body.documents) {
      enrollment.documents = body.documents;
    }

    await enrollment.save();

    return NextResponse.json({
      message: "Enrollment updated successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findById(params.id);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check authorization
    const isAdmin = session.user.role === "admin" || session.user.role === "registrar";
    const isOwner = session.user.role === "parent" && enrollment.submittedBy?.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isOwner && !enrollment.isDraft && enrollment.status !== "pending") {
      return NextResponse.json(
        { error: "Cannot delete enrollment after it has been reviewed" },
        { status: 400 }
      );
    }

    const studentId = enrollment.studentId ? enrollment.studentId.toString() : null;

    await Document.deleteMany({ enrollmentId: params.id });

    await Enrollment.findByIdAndDelete(params.id);

    if (studentId) {
      const otherEnrollments = await Enrollment.countDocuments({ studentId });

      if (otherEnrollments === 0) {
        await Student.findByIdAndDelete(studentId);
      } else {
        await Student.findByIdAndUpdate(studentId, {
          $pull: { enrollmentHistory: params.id },
        });
      }
    }

    return NextResponse.json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
