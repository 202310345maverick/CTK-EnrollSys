import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import DocumentModel from "@/models/Document";
import Student from "@/models/Student";
import { v2 as cloudinary } from "cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const doc = await DocumentModel.findById(params.id).lean();
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const role = session.user.role;

  if (role === "parent") {
    const student = await Student.findOne({
      _id: doc.studentId,
      parentUserId: session.user.id,
    }).lean();
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (role !== "admin" && role !== "registrar") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileUrl = doc.secureUrl || doc.cloudinaryUrl;
  if (!fileUrl) {
    return NextResponse.json({ error: "File URL not found" }, { status: 404 });
  }

  const isRaw = fileUrl.includes("/raw/upload/") || doc.mimeType === "application/pdf";
  try {
    const signedUrl = cloudinary.url(doc.cloudinaryId, {
      resource_type: isRaw ? "raw" : "image",
      type: "upload",
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch {
    // Fallback to stored secure URL if signing fails
    return NextResponse.redirect(fileUrl, { status: 302 });
  }
}
