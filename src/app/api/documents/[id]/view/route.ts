import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import DocumentModel from "@/models/Document";
import Student from "@/models/Student";

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

  // Parents can only access documents for their own students
  if (role === "parent") {
    const student = await Student.findOne({
      _id: doc.studentId,
      parentUserId: session.user.id,
    }).lean();
    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Admins and registrars have unrestricted access
  if (role !== "admin" && role !== "registrar" && role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileUrl = doc.secureUrl || doc.cloudinaryUrl;
  if (!fileUrl) {
    return NextResponse.json({ error: "File URL not found" }, { status: 404 });
  }

  // Proxy the file through the server so raw Cloudinary URLs are never exposed
  const upstream = await fetch(fileUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || doc.mimeType || "application/octet-stream";
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${doc.originalName || doc.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
