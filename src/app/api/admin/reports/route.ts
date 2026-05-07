import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import "@/models/Student";
import "@/models/SchoolYear";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalStudents,
      totalEnrollments,
      pendingEnrollments,
      enrollmentsByGradeRaw,
      enrollmentsByStatusRaw,
      paymentAgg,
      recentPayments,
      paymentByTypeRaw,
      paymentDailyRaw,
      voidedAgg,
      paymentListRaw,
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
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Payment.find({ isVoided: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("studentId", "personalInfo studentId")
        .lean(),
      Payment.aggregate([
        { $match: { isVoided: false } },
        { $group: { _id: "$paymentType", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { isVoided: false, paymentDate: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { isVoided: true } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Payment.find({ isVoided: false })
        .sort({ paymentDate: -1 })
        .limit(100)
        .populate("studentId", "personalInfo studentId")
        .populate("receivedBy", "profile.firstName profile.lastName")
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
      payments: {
        totalAmount: paymentAgg[0]?.total || 0,
        count: paymentAgg[0]?.count || 0,
        byType: paymentByTypeRaw.map((t) => ({ type: t._id || "other", amount: t.amount, count: t.count })),
        recentDaily: paymentDailyRaw.map((d) => ({ date: d._id, amount: d.amount, count: d.count })),
        voidedCount: voidedAgg[0]?.count || 0,
        voidedAmount: voidedAgg[0]?.total || 0,
        list: paymentListRaw.map((p: any) => ({
          receiptNumber: p.receiptNumber || "",
          studentName: p.studentId
            ? `${p.studentId.personalInfo?.lastName || ""}, ${p.studentId.personalInfo?.firstName || ""}`
            : "—",
          paymentType: p.paymentType || "",
          amount: p.amount || 0,
          paymentDate: p.paymentDate,
          recordedBy: p.receivedBy
            ? `${p.receivedBy.profile?.firstName || ""} ${p.receivedBy.profile?.lastName || ""}`.trim()
            : "—",
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
