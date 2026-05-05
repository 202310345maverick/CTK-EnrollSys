import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Document from "@/models/Document";
import { ENROLLMENT_DOCUMENT_TYPES } from "@/lib/enrollment/constants";

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

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      session.user.id,
      "enrollments",
      params.id
    );
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${documentType}_${timestamp}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${session.user.id}/enrollments/${params.id}/${filename}`;

    const studentId = enrollment.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Enrollment is missing a student record" }, { status: 400 });
    }

    const existingDocument = await Document.findOne({
      enrollmentId: enrollment._id,
      type: documentType,
    });

    if (existingDocument) {
      await Document.findByIdAndDelete(existingDocument._id);
      enrollment.documents = (enrollment.documents || []).filter(
        (document: { type: string }) => document.type !== documentType
      );
    }

    const createdDocument = await Document.create({
      studentId,
      enrollmentId: enrollment._id,
      type: documentType,
      fileName: filename,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      cloudinaryId: filename,
      cloudinaryUrl: publicUrl,
      secureUrl: publicUrl,
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

    const refreshedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("studentId", "personalInfo")
      .populate("documents.documentId", "secureUrl originalName fileName createdAt")
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