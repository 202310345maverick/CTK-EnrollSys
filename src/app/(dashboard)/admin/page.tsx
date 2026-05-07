import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import SchoolYear from "@/models/SchoolYear";
import "@/models/Student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  CreditCard,
  UserCog,
  CheckCircle2,
  TrendingUp,
  Eye,
  GraduationCap,
  BarChart3,
  Calendar,
  Shield,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EnrollmentPeriodControl } from "@/components/admin/enrollment-period-control";

async function getDashboardData() {
  await dbConnect();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalStudents,
    totalEnrollments,
    pendingEnrollments,
    approvedToday,
    submittedToday,
    underReviewCount,
    approvedCount,
    rejectedCount,
    enrolledCount,
    paymentAgg,
    recentEnrollments,
    recentPayments,
    activeSchoolYear,
  ] = await Promise.all([
    User.countDocuments(),
    Student.countDocuments(),
    Enrollment.countDocuments({ isDraft: { $ne: true } }),
    Enrollment.countDocuments({ status: "pending", isDraft: { $ne: true } }),
    Enrollment.countDocuments({
      status: { $in: ["approved", "enrolled"] },
      updatedAt: { $gte: todayStart },
    }),
    Enrollment.countDocuments({
      isDraft: { $ne: true },
      createdAt: { $gte: todayStart },
    }),
    Enrollment.countDocuments({ status: "under_review" }),
    Enrollment.countDocuments({ status: "approved" }),
    Enrollment.countDocuments({ status: "rejected" }),
    Enrollment.countDocuments({ status: "enrolled" }),
    Payment.aggregate([
      { $match: { isVoided: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Enrollment.find({ isDraft: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "personalInfo")
      .lean(),
    Payment.find({ isVoided: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "personalInfo")
      .lean(),
    SchoolYear.findOne({ isActive: true }).lean(),
  ]);

  const totalPayments = paymentAgg[0]?.total || 0;

  return {
    totalUsers,
    totalStudents,
    totalEnrollments,
    pendingEnrollments,
    approvedToday,
    submittedToday,
    underReviewCount,
    approvedCount,
    rejectedCount,
    enrolledCount,
    totalPayments,
    recentEnrollments,
    recentPayments,
    activeSchoolYear,
  };
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  enrolled: "bg-purple-100 text-purple-800 border-purple-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function AdminDashboard() {
  await getServerSession(authOptions);
  const {
    totalUsers,
    totalStudents,
    pendingEnrollments,
    approvedToday,
    submittedToday,
    underReviewCount,
    approvedCount,
    rejectedCount,
    enrolledCount,
    totalPayments,
    recentEnrollments,
    recentPayments,
    activeSchoolYear,
  } = await getDashboardData();

  const stats = [
    { label: "Total Users", value: totalUsers, icon: UserCog, color: "text-blue-600", border: "border-l-blue-500" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-emerald-600", border: "border-l-emerald-500" },
    { label: "Pending Enrollments", value: pendingEnrollments, icon: ClipboardList, color: "text-amber-600", border: "border-l-amber-500" },
    { label: "Total Collections", value: formatCurrency(totalPayments), icon: CreditCard, color: "text-purple-600", border: "border-l-purple-500" },
    { label: "Approved Today", value: approvedToday, icon: CheckCircle2, color: "text-teal-600", border: "border-l-teal-500" },
    { label: "Submitted Today", value: submittedToday, icon: TrendingUp, color: "text-cyan-600", border: "border-l-cyan-500" },
    { label: "Under Review", value: underReviewCount, icon: Eye, color: "text-indigo-600", border: "border-l-indigo-500" },
    { label: "Enrolled", value: enrolledCount, icon: GraduationCap, color: "text-violet-600", border: "border-l-violet-500" },
  ];

  const statusBreakdown = [
    { label: "Pending", count: pendingEnrollments, color: "text-amber-600", bg: "bg-amber-400" },
    { label: "Under Review", count: underReviewCount, color: "text-indigo-600", bg: "bg-indigo-400" },
    { label: "Approved", count: approvedCount, color: "text-emerald-600", bg: "bg-emerald-400" },
    { label: "Enrolled", count: enrolledCount, color: "text-violet-600", bg: "bg-violet-400" },
    { label: "Not Approved", count: rejectedCount, color: "text-red-600", bg: "bg-red-400" },
  ];
  const totalAll = statusBreakdown.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-xs text-slate-500">System overview · {approvedToday} approved today</p>
      </div>

      {/* Stats — 8 cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border-l-4 ${s.border}`}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enrollment Status Breakdown */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-primary" /> Enrollment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {statusBreakdown.map(({ label, count, color, bg }) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
              <div className="flex-1 rounded-full bg-slate-100 h-2">
                <div
                  className={`h-2 rounded-full ${bg}`}
                  style={{ width: `${totalAll > 0 ? Math.max(4, (count / totalAll) * 100) : 0}%` }}
                />
              </div>
              <span className={`w-8 text-right font-semibold ${color}`}>{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-xs h-9">
            <UserCog className="h-3.5 w-3.5" />Manage Users
          </Button>
        </Link>
        <Link href="/admin/school-years">
          <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-xs h-9">
            <Calendar className="h-3.5 w-3.5" />School Years
          </Button>
        </Link>
        <Link href="/admin/fee-structures">
          <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-xs h-9">
            <CreditCard className="h-3.5 w-3.5" />Fee Structures
          </Button>
        </Link>
        <Link href="/admin/audit-logs">
          <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-xs h-9">
            <Shield className="h-3.5 w-3.5" />Audit Logs
          </Button>
        </Link>
      </div>

      {/* Enrollment Period Control */}
      {activeSchoolYear ? (
        <EnrollmentPeriodControl
          schoolYearId={(activeSchoolYear._id as { toString(): string }).toString()}
          schoolYearName={activeSchoolYear.name}
          currentStatus={activeSchoolYear.status}
        />
      ) : (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">No active school year</p>
              <p className="text-xs text-amber-600">
                <Link href="/admin/school-years" className="underline">Create a school year</Link> to enable enrollment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Enrollments */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              Recent Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentEnrollments.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No enrollments yet.</p>
            ) : (
              <div className="space-y-1.5">
                {recentEnrollments.map((enrollment: any) => {
                  const student = enrollment.studentId;
                  const name = student?.personalInfo
                    ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
                    : "Unknown Student";
                  const statusClass = statusColors[enrollment.status] || "bg-slate-100 text-slate-800";
                  return (
                    <div key={enrollment._id?.toString()} className="flex items-center gap-3 rounded-lg border bg-slate-50/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.gradeLevel || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDate(enrollment.createdAt)}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                          {{ pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Not Approved", enrolled: "Enrolled" }[(enrollment.status || "") as string] ?? (enrollment.status || "").replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-1.5">
                {recentPayments.map((payment: any) => {
                  const student = payment.studentId;
                  const name = student?.personalInfo
                    ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
                    : "Unknown Student";
                  return (
                    <div key={payment._id?.toString()} className="flex items-center gap-3 rounded-lg border bg-slate-50/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{(payment.paymentType || "").replace("_", " ")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDate(payment.paymentDate || payment.createdAt)}</span>
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(payment.amount || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
