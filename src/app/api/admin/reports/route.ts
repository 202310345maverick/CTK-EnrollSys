import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import "@/models/Student";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const [
      totalUsers,
      totalStudents,
      totalEnrollments,
      pendingEnrollments,
      enrollmentsByGradeRaw,
      enrollmentsByStatusRaw,
      paymentAgg,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Enrollment.countDocuments({ isDraft: { $ne: true } }),
      Enrollment.countDocuments({ status: "pending", isDraft: { $ne: true } }),
      Enrollment.aggregate([
        { $match: { isDraft: { $ne: true } } },
        { $group: { _id: "$gradeLevel", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Enrollment.aggregate([
        { $match: { isDraft: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { isVoided: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.find({ isVoided: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("studentId", "personalInfo studentId")
        .lean(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalEnrollments,
      pendingEnrollments,
      enrollmentsByGrade: enrollmentsByGradeRaw.map((e) => ({ grade: e._id || "Unknown", count: e.count })),
      enrollmentsByStatus: enrollmentsByStatusRaw.map((e) => ({ status: e._id || "unknown", count: e.count })),
      totalPayments: paymentAgg[0]?.total || 0,
      recentPayments,
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
