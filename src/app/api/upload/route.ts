import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ENROLLMENT_DOCUMENT_TYPES, ALLOWED_UPLOAD_EXTENSIONS, ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/enrollment/constants";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/jpg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some(({ bytes, offset = 0 }) =>
    bytes.every((byte, i) => buffer[offset + i] === byte)
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType || !ENROLLMENT_DOCUMENT_TYPES.includes(documentType as (typeof ENROLLMENT_DOCUMENT_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // SEC-005: Extension validation
    const fileExt = path.extname(file.name).toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // SEC-005: Magic bytes validation
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match the declared file type" },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(buffer, {
      folder: `ctk-enrollsys/uploads/${session.user.id}`,
      public_id: `${documentType}_${Date.now()}`,
    });

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "UPLOAD",
      resource: "DOCUMENT",
      resourceId: result.public_id,
      details: { documentType, originalName: file.name, size: file.size, mimeType: file.type },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      url: result.secure_url,
      cloudinaryId: result.public_id,
      filename: result.public_id,
      originalName: file.name,
      documentType,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    logger.error("Error uploading file", { route: "POST /api/upload", error: String(error) });
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
