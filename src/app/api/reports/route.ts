import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import SchoolYear from "@/models/SchoolYear";
import "@/models/Student";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "registrar"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "enrollment";
    const schoolYearId = searchParams.get("schoolYearId") || "";
    const gradeLevel = searchParams.get("gradeLevel") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Fetch school years for dropdowns
    const schoolYears = await SchoolYear.find({}).sort({ startDate: -1 }).lean();

    if (type === "payment") {
      const payFilter: Record<string, unknown> = { isVoided: false };
      if (dateFrom || dateTo) {
        payFilter.paymentDate = {};
        if (dateFrom) (payFilter.paymentDate as Record<string, unknown>).$gte = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          (payFilter.paymentDate as Record<string, unknown>).$lte = end;
        }
      }

      const [payAgg, voidedAgg, byTypeRaw, dailyRaw, payList] = await Promise.all([
        Payment.aggregate([{ $match: payFilter }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Payment.aggregate([{ $match: { isVoided: true } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Payment.aggregate([
          { $match: payFilter },
          { $group: { _id: "$paymentType", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Payment.aggregate([
          { $match: payFilter },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Payment.find(payFilter)
          .sort({ paymentDate: -1 })
          .limit(500)
          .populate("studentId", "personalInfo studentId lrn")
          .populate("receivedBy", "profile.firstName profile.lastName")
          .lean(),
      ]);

      return NextResponse.json({
        schoolYears,
        payments: {
          totalAmount: payAgg[0]?.total || 0,
          count: payAgg[0]?.count || 0,
          voidedCount: voidedAgg[0]?.count || 0,
          voidedAmount: voidedAgg[0]?.total || 0,
          byType: byTypeRaw.map((t) => ({ type: t._id || "other", amount: t.amount, count: t.count })),
          daily: dailyRaw.map((d) => ({ date: d._id, amount: d.amount, count: d.count })),
          list: payList.map((p: any) => ({
            receiptNumber: p.receiptNumber || "",
            referenceNumber: p.referenceNumber || "",
            studentName: p.studentId
              ? `${p.studentId.personalInfo?.lastName || ""}, ${p.studentId.personalInfo?.firstName || ""}`
              : "—",
            lrn: p.studentId?.lrn || "",
            paymentType: p.paymentType || "",
            amount: p.amount || 0,
            paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
            recordedBy: p.receivedBy
              ? `${p.receivedBy.profile?.firstName || ""} ${p.receivedBy.profile?.lastName || ""}`.trim()
              : "—",
            notes: p.notes || "",
          })),
        },
      });
    }

    // Enrollment / SF1 / SF2
    const enrollFilter: Record<string, unknown> = { isDraft: { $ne: true } };
    if (schoolYearId) enrollFilter.schoolYearId = schoolYearId;
    if (gradeLevel) enrollFilter.gradeLevel = gradeLevel;
    if (status) {
      enrollFilter.status = status;
    } else if (type === "sf1" || type === "sf2") {
      enrollFilter.status = "enrolled";
    }
    if (dateFrom || dateTo) {
      enrollFilter.createdAt = {};
      if (dateFrom) (enrollFilter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (enrollFilter.createdAt as Record<string, unknown>).$lte = end;
      }
    }

    const enrollments = await Enrollment.find(enrollFilter)
      .sort({ gradeLevel: 1, createdAt: -1 })
      .populate("studentId", "personalInfo contactInfo guardianInfo lrn studentId currentGradeLevel section")
      .populate("schoolYearId", "name")
      .lean();

    // Summary aggregations
    const [byGradeRaw, byStatusRaw] = await Promise.all([
      Enrollment.aggregate([{ $match: enrollFilter }, { $group: { _id: "$gradeLevel", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Enrollment.aggregate([{ $match: enrollFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const rows = enrollments.map((e: any, idx: number) => {
      const s = e.studentId;
      const pi = s?.personalInfo || {};
      const ci = s?.contactInfo || {};
      const gi = s?.guardianInfo || {};
      const birthDate = pi.birthDate ? new Date(pi.birthDate) : null;
      const age = birthDate
        ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000))
        : null;

      const guardianName =
        gi.guardian?.fullName ||
        gi.mother?.fullName ||
        gi.father?.fullName ||
        "—";
      const guardianContact =
        gi.guardian?.contactNumber ||
        gi.mother?.contactNumber ||
        gi.father?.contactNumber ||
        "—";

      const address = ci.address
        ? [ci.address.street, ci.address.barangay, ci.address.city, ci.address.province]
            .filter(Boolean)
            .join(", ")
        : "—";

      return {
        no: idx + 1,
        enrollmentNumber: e.enrollmentNumber,
        lrn: s?.lrn || "—",
        studentId: s?.studentId || "—",
        lastName: pi.lastName || "—",
        firstName: pi.firstName || "—",
        middleName: pi.middleName || "",
        suffix: pi.suffix || "",
        sex: pi.gender === "male" ? "M" : pi.gender === "female" ? "F" : "—",
        birthDate: birthDate ? birthDate.toLocaleDateString("en-PH") : "—",
        age: age !== null ? String(age) : "—",
        motherTongue: pi.motherTongue || "—",
        religion: pi.religion || "—",
        address,
        guardianName,
        guardianContact,
        gradeLevel: e.gradeLevel || "—",
        section: s?.section || e.section || "—",
        status: e.status,
        enrollmentType: e.enrollmentType || "—",
        schoolYear: (e.schoolYearId as any)?.name || "—",
        submittedAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-PH") : "—",
        enrollmentDate: e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString("en-PH") : "—",
      };
    });

    return NextResponse.json({
      schoolYears,
      total: rows.length,
      byGrade: byGradeRaw.map((g) => ({ grade: g._id || "Unknown", count: g.count })),
      byStatus: byStatusRaw.map((s) => ({ status: s._id || "unknown", count: s.count })),
      rows,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
