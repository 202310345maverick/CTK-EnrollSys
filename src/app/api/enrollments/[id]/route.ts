import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Document from "@/models/Document";
import FeeStructure from "@/models/FeeStructure";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { sendStatusChangeEmail, sendReuploadRequestEmail, sendFeeAssessmentEmail } from "@/lib/auth/email";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

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
      .populate("documents.documentId", "secureUrl originalName fileName createdAt aiAnalysis")
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Check authorization - parents can only view their own
    if (session.user.role === "parent" && enrollment.submittedBy?.toString() !== session.user.id) {
      // SEC-003: parent isolation enforced
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    logger.error("Error fetching enrollment", { route: "GET /api/enrollments/[id]", error: String(error) });
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
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

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

      // If approved or enrolled, assign section if provided and auto-assess fees if not yet assessed
      if (body.status === "approved" || body.status === "enrolled") {
        if (body.section) {
          await Student.findByIdAndUpdate(enrollment.studentId, {
            section: body.section,
          });
        }
        if (!enrollment.assessedFees) {
          const feeStructure = await FeeStructure.findOne({
            schoolYearId: enrollment.schoolYearId,
            gradeLevel: enrollment.gradeLevel,
            isActive: true,
          });
          if (feeStructure) {
            enrollment.assessedFees = {
              feeStructureId: feeStructure._id,
              totalAmount: feeStructure.totalAmount,
              breakdown: feeStructure.fees.map((f: any) => ({
                description: f.description,
                amount: f.amount,
              })),
            };
          }
        }
      }
    }

    // Save remarks even without status change (internal notes)
    if (isAdmin && body.remarks && !body.status) {
      enrollment.remarks = body.remarks;
      enrollment.statusHistory.push({
        status: enrollment.status,
        changedBy: new Types.ObjectId(session.user.id),
        changedAt: new Date(),
        remarks: body.remarks,
      });
    }

    // Admin/registrar can update individual document status
    if (isAdmin && body.documentUpdate) {
      const { documentType, status: docStatus, remarks: docRemarks } = body.documentUpdate;
      const docIndex = enrollment.documents.findIndex((d: any) => d.type === documentType);
      if (docIndex !== -1) {
        enrollment.documents[docIndex].status = docStatus;
        if (docRemarks) enrollment.documents[docIndex].remarks = docRemarks;
        enrollment.markModified("documents");

        // Sync verificationStatus on the Document model itself
        const docRef = enrollment.documents[docIndex].documentId;
        if (docRef) {
          const docId = typeof docRef === "object" && "_id" in docRef ? docRef._id : docRef;
          await Document.findByIdAndUpdate(docId, {
            $set: {
              verificationStatus: docStatus,
              verificationNote: docRemarks ?? null,
              verifiedBy: session.user.id,
              verifiedAt: new Date(),
            },
          });
        }
      }
    }

    if (isOwner && enrollment.isDraft && body.draftData) {
      enrollment.draftData = body.draftData;
      enrollment.enrollmentType = body.draftData?.enrollmentType || enrollment.enrollmentType;
      enrollment.gradeLevel = body.draftData?.gradeLevel || enrollment.gradeLevel;
      enrollment.status = "draft";
    }

    // Admin/registrar can manually save fee assessment
    if (isAdmin && body.assessedFees) {
      enrollment.assessedFees = {
        feeStructureId: body.assessedFees.feeStructureId ?? enrollment.assessedFees?.feeStructureId,
        totalAmount: body.assessedFees.totalAmount,
        breakdown: body.assessedFees.breakdown,
      };
      enrollment.markModified("assessedFees");
    }

    // Update documents if provided
    if (body.documents) {
      enrollment.documents = body.documents;
    }

    await enrollment.save();

    if (isAdmin && body.status) {
      const auditAction = body.status === "approved" ? "APPROVE" : body.status === "rejected" ? "REJECT" : "UPDATE";
      void createAuditLog({
        userId: session.user.id,
        action: auditAction,
        resource: "ENROLLMENT",
        resourceId: params.id,
        details: { status: body.status },
        ipAddress,
        userAgent,
      });
    } else if (isAdmin && body.documentUpdate) {
      void createAuditLog({
        userId: session.user.id,
        action: "VERIFY",
        resource: "DOCUMENT",
        resourceId: params.id,
        details: { documentUpdate: body.documentUpdate },
        ipAddress,
        userAgent,
      });
    }

    // Fire-and-forget notifications
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    void Promise.resolve().then(async () => {
      if (isAdmin && body.status && body.status !== "draft") {
        const parent = await User.findById(enrollment.submittedBy).select("email profile").lean();
        if (parent) {
          const parentName = `${parent.profile?.firstName ?? ""} ${parent.profile?.lastName ?? ""}`.trim() || parent.email;
          // Fetch student separately — enrollment was not populated on this request
          const student = await Student.findById(enrollment.studentId).select("personalInfo").lean();
          const studentName = student?.personalInfo
            ? `${student.personalInfo.firstName ?? ""} ${student.personalInfo.lastName ?? ""}`.trim()
            : "";
          const statusLabel = (body.status as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          await sendStatusChangeEmail({
            email: parent.email,
            name: parentName,
            enrollmentNumber: enrollment.enrollmentNumber,
            studentName,
            gradeLevel: enrollment.gradeLevel,
            newStatus: body.status,
            remarks: body.remarks,
            link: `${appUrl}/parent/enrollments/${enrollment._id}`,
          });
          await createNotification({
            userId: enrollment.submittedBy.toString(),
            title: `Enrollment ${statusLabel}`,
            message: `Your enrollment application ${enrollment.enrollmentNumber}${studentName ? ` for ${studentName}` : ""} has been updated to ${statusLabel}.`,
            type: body.status === "approved" || body.status === "enrolled" ? "success" : body.status === "rejected" ? "error" : "info",
            link: `/parent/enrollments/${enrollment._id}`,
          });
        }
      }

      if (isAdmin && body.assessedFees) {
        const feeParent = await User.findById(enrollment.submittedBy).select("email profile").lean();
        if (feeParent) {
          const feeParentName = `${feeParent.profile?.firstName ?? ""} ${feeParent.profile?.lastName ?? ""}`.trim() || feeParent.email;
          const feeStudent = await Student.findById(enrollment.studentId).select("personalInfo").lean();
          const feeStudentName = feeStudent?.personalInfo
            ? `${feeStudent.personalInfo.firstName ?? ""} ${feeStudent.personalInfo.lastName ?? ""}`.trim()
            : "";
          await sendFeeAssessmentEmail({
            email: feeParent.email,
            name: feeParentName,
            enrollmentNumber: enrollment.enrollmentNumber,
            studentName: feeStudentName,
            gradeLevel: enrollment.gradeLevel,
            totalAmount: body.assessedFees.totalAmount,
            breakdown: body.assessedFees.breakdown,
            link: `${appUrl}/parent/enrollments/${enrollment._id}`,
          });
          await createNotification({
            userId: enrollment.submittedBy.toString(),
            title: "Fee Assessment Ready",
            message: `School fees for ${feeStudentName || "your student"} (${enrollment.enrollmentNumber}) have been assessed. Total: ₱${body.assessedFees.totalAmount.toLocaleString("en-PH")}.`,
            type: "info",
            link: `/parent/enrollments/${enrollment._id}`,
          });
        }
      }

      if (isAdmin && body.documentUpdate) {
        const { status: docStatus, documentType, remarks: docRemarks } = body.documentUpdate;
        if (docStatus === "rejected") {
          const parent = await User.findById(enrollment.submittedBy).select("email profile").lean();
          if (parent) {
            const parentName = `${parent.profile?.firstName ?? ""} ${parent.profile?.lastName ?? ""}`.trim() || parent.email;
            const docStudent = await Student.findById(enrollment.studentId).select("personalInfo").lean();
            const studentName = docStudent?.personalInfo
              ? `${docStudent.personalInfo.firstName ?? ""} ${docStudent.personalInfo.lastName ?? ""}`.trim()
              : "";
            await sendReuploadRequestEmail({
              email: parent.email,
              name: parentName,
              studentName,
              documentType,
              remarks: docRemarks,
              link: `${appUrl}/parent`,
            });
            await createNotification({
              userId: enrollment.submittedBy.toString(),
              title: "Document Re-upload Required",
              message: `A document (${documentType}) for your enrollment application ${enrollment.enrollmentNumber} has been rejected and requires re-upload.`,
              type: "warning",
              link: `/parent/enrollments/${enrollment._id}`,
            });
          }
        }
      }
    }).catch(console.error);

    return NextResponse.json({
      message: "Enrollment updated successfully",
      enrollment,
    });
  } catch (error) {
    logger.error("Error updating enrollment", { route: "PUT /api/enrollments/[id]", error: String(error) });
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

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "ENROLLMENT",
      resourceId: params.id,
      ipAddress,
      userAgent,
    });

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
    logger.error("Error deleting enrollment", { route: "DELETE /api/enrollments/[id]", error: String(error) });
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
