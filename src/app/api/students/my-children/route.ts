import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const students = await Student.find({ parentUserId: session.user.id })
    .select("studentId lrn personalInfo contactInfo guardianInfo currentGradeLevel status")
    .lean();

  if (!students.length) return NextResponse.json({ children: [] });

  const studentIds = students.map((s: any) => s._id);

  // Latest submitted (non-draft) enrollment per student for auto-fill data
  const latestEnrollments = await Enrollment.find({
    studentId: { $in: studentIds },
    isDraft: false,
  })
    .sort({ createdAt: -1 })
    .select("studentId gradeLevel draftData")
    .lean();

  const latestMap = new Map<string, any>();
  for (const e of latestEnrollments) {
    const sid = String(e.studentId);
    if (!latestMap.has(sid)) latestMap.set(sid, e);
  }

  const children = students.map((student: any) => {
    const latest = latestMap.get(String(student._id));
    return {
      _id: String(student._id),
      studentId: student.studentId,
      lrn: student.lrn ?? null,
      personalInfo: student.personalInfo,
      contactInfo: student.contactInfo,
      guardianInfo: student.guardianInfo,
      currentGradeLevel: student.currentGradeLevel ?? null,
      status: student.status,
      latestEnrollment: latest
        ? {
            gradeLevel: latest.gradeLevel,
            monthlyIncome: latest.draftData?.monthlyIncome ?? null,
            numberOfSiblings: latest.draftData?.numberOfSiblings ?? null,
            parentOccupation: latest.draftData?.parentOccupation ?? null,
            parentAddress: latest.draftData?.parentAddress ?? null,
            lastSchoolAttended: latest.draftData?.lastSchoolAttended ?? null,
          }
        : null,
    };
  });

  return NextResponse.json({ children });
}
