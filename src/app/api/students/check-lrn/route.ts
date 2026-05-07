import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";

// GET /api/students/check-lrn?lrn=XXXX&excludeStudentId=YYY
// Returns { available: boolean, studentId?: string }
// excludeStudentId lets returning/transferee flows skip the student being updated
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lrn = searchParams.get("lrn")?.trim();
  const excludeStudentId = searchParams.get("excludeStudentId");

  if (!lrn) {
    return NextResponse.json({ error: "lrn query param required" }, { status: 400 });
  }

  if (!/^\d{12}$/.test(lrn)) {
    return NextResponse.json({ available: false, reason: "LRN must be exactly 12 digits" });
  }

  await dbConnect();

  const query: Record<string, unknown> = { lrn };
  if (excludeStudentId) {
    query._id = { $ne: excludeStudentId };
  }

  const existing = await Student.findOne(query).select("_id studentId personalInfo.firstName personalInfo.lastName").lean();

  if (existing) {
    return NextResponse.json({
      available: false,
      reason: "This LRN is already registered to another student.",
    });
  }

  return NextResponse.json({ available: true });
}
