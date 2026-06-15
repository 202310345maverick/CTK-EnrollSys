import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Document from "@/models/Document";
import { ENROLLMENT_DOCUMENT_TYPES, ALLOWED_UPLOAD_EXTENSIONS, ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/enrollment/constants";
import { analyzeDocument } from "@/lib/ai-document-verify";
import { analyzeDocumentLocal } from "@/lib/ai-document-verify-local";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";

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

    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB` },
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
      await deleteFromCloudinary(existingDocument.cloudinaryId, "image");
      await Document.findByIdAndDelete(existingDocument._id);
      enrollment.documents = (enrollment.documents || []).filter(
        (document: { type: string }) => document.type !== documentType
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Upload everything as "image" so Cloudinary OCR add-on works on PDFs too
    const result = await uploadToCloudinary(buffer, {
      folder: `ctk-enrollsys/enrollments/${params.id}`,
      public_id: `${documentType}_${Date.now()}`,
      resource_type: "image",
      ocr: "adv_ocr",
    });

    const cloudinaryResourceType = "image";
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
    setImmediate(async () => {
      try {
        const student = await Student.findById(studentId).select("personalInfo").lean();
        const studentName = student
          ? `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim()
          : undefined;

        let analysis: any;
        if (mimeType === "application/pdf") {
          // PDFs: fallback to Cloudinary OCR (already requested at upload time)
          analysis = await analyzeDocument({
            cloudinaryPublicId: publicId,
            cloudinaryResourceType,
            mimeType,
            expectedDocumentType: docType,
            studentName: studentName || undefined,
            uploadOcrInfo: result.info,
          });
        } else {
          // Images: run local OCR (tesseract.js)
          analysis = await analyzeDocumentLocal({
            buffer,
            mimeType,
            expectedDocumentType: docType,
            studentName: studentName || undefined,
          });
        }

        const update: any = { aiAnalysis: analysis };
        if (analysis.status === "passed") {
          update.verificationStatus = "verified";
          update.verifiedAt = new Date();
        }

        await Document.findByIdAndUpdate(docId, update);

        if (analysis.status === "passed") {
          await Enrollment.updateOne(
            { _id: enrollment._id, "documents.documentId": docId },
            { $set: { "documents.$.status": "verified" } }
          );
        }

        if (analysis.status === "flagged" || analysis.status === "needs_review") {
          try {
            const registrars = await User.find({ role: "registrar" }).select("_id").lean();
            const message = `A document (${file.name}) for ${enrollment.enrollmentNumber} was flagged by AI verification.`;
            for (const r of registrars) {
              await createNotification({
                userId: r._id,
                title: "Document flagged for review",
                message,
                link: `/dashboard/registrar/enrollments/${enrollment._id}`,
              });
            }
          } catch (notifyErr) {
            console.error("[AI] Failed to notify registrars:", notifyErr);
          }
        }
      } catch (err) {
        console.error("[AI] Document analysis failed:", err);
      }
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
