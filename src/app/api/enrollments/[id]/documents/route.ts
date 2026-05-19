import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Document from "@/models/Document";
import { ENROLLMENT_DOCUMENT_TYPES } from "@/lib/enrollment/constants";
import { analyzeDocument } from "@/lib/ai-document-verify";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findById(params.id);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const isAdminOrRegistrar = session.user.role === "admin" || session.user.role === "registrar";

    if (!isAdminOrRegistrar) {
      const isOwner = enrollment.submittedBy?.toString() === session.user.id;
      if (!isOwner) {
        const student = enrollment.studentId
          ? await Student.findOne({ _id: enrollment.studentId, userId: session.user.id })
          : null;
        if (!student) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const documents = await Document.find({ enrollmentId: enrollment._id }).lean();

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching enrollment documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findById(params.id);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const isAdminOrRegistrar = session.user.role === "admin" || session.user.role === "registrar";
    const isOwner = enrollment.submittedBy?.toString() === session.user.id;

    if (!isAdminOrRegistrar && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      !documentType ||
      !ENROLLMENT_DOCUMENT_TYPES.includes(
        documentType as (typeof ENROLLMENT_DOCUMENT_TYPES)[number]
      )
    ) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPG, PNG" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const studentId = enrollment.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Enrollment is missing a student record" }, { status: 400 });
    }

    const existingDocument = await Document.findOne({
      enrollmentId: enrollment._id,
      type: documentType,
    });

    if (existingDocument) {
      await deleteFromCloudinary(existingDocument.cloudinaryId);
      await Document.findByIdAndDelete(existingDocument._id);
      enrollment.documents = (enrollment.documents || []).filter(
        (document: { type: string }) => document.type !== documentType
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, {
      folder: `ctk-enrollsys/enrollments/${params.id}`,
      public_id: `${documentType}_${Date.now()}`,
    });

    const createdDocument = await Document.create({
      studentId,
      enrollmentId: enrollment._id,
      type: documentType,
      fileName: result.public_id,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      cloudinaryId: result.public_id,
      cloudinaryUrl: result.secure_url,
      secureUrl: result.secure_url,
      uploadedBy: session.user.id,
    });

    enrollment.documents = [
      ...(enrollment.documents || []),
      {
        type: createdDocument.type,
        documentId: createdDocument._id,
        status: "pending",
      },
    ];
    await enrollment.save();

    // Run AI analysis fully async — never blocks the upload response
    const docId = createdDocument._id;
    const publicId = result.public_id;
    const mimeType = file.type;
    const docType = documentType;
    setImmediate(() => {
      Student.findById(studentId).select("personalInfo").lean()
        .then((student: any) => {
          const studentName = student
            ? `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim()
            : undefined;
          return analyzeDocument({
            cloudinaryPublicId: publicId,
            mimeType,
            expectedDocumentType: docType,
            studentName: studentName || undefined,
          });
        })
        .then((analysis) => Document.findByIdAndUpdate(docId, { aiAnalysis: analysis }))
        .catch((err: unknown) => console.error("[AI] Document analysis failed:", err));
    });

    const refreshedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("studentId", "personalInfo")
      .populate("documents.documentId", "secureUrl originalName fileName createdAt aiAnalysis")
      .lean();

    return NextResponse.json({
      message: "Document uploaded successfully",
      enrollment: refreshedEnrollment,
      document: createdDocument,
    });
  } catch (error) {
    console.error("Error uploading enrollment document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
