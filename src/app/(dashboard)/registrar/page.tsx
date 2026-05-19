export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Payment from "@/models/Payment";
import SchoolYear from "@/models/SchoolYear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardList, CheckCircle2, Eye, Clock, XCircle,
  GraduationCap, CreditCard, FileText, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AutoRefresh from "@/components/shared/auto-refresh";

async function getRegistrarDashboardData() {
  await dbConnect();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    pendingCount,
    underReviewCount,
    approvedCount,
    enrolledCount,
    rejectedCount,
    submittedToday,
    totalStudents,
    paymentAgg,
    recentEnrollments,
    activeSchoolYear,
  ] = await Promise.all([
    Enrollment.countDocuments({ status: "pending", isDraft: { $ne: true } }),
    Enrollment.countDocuments({ status: "under_review" }),
    Enrollment.countDocuments({ status: "approved" }),
    Enrollment.countDocuments({ status: "enrolled" }),
    Enrollment.countDocuments({ status: "rejected" }),
    Enrollment.countDocuments({ isDraft: { $ne: true }, createdAt: { $gte: todayStart } }),
    Student.countDocuments(),
    Payment.aggregate([
      { $match: { isVoided: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Enrollment.find({ isDraft: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("studentId", "personalInfo")
      .lean(),
    SchoolYear.findOne({ isActive: true }).lean(),
  ]);

  return {
    pendingCount,
    underReviewCount,
    approvedCount,
    enrolledCount,
    rejectedCount,
    submittedToday,
    totalStudents,
    totalCollections: paymentAgg[0]?.total || 0,
    recentEnrollments,
    activeSchoolYear,
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  enrolled: "bg-purple-100 text-purple-800 border-purple-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Not Approved",
  enrolled: "Enrolled",
};

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default async function RegistrarDashboard() {
  await getServerSession(authOptions);
  const {
    pendingCount,
    underReviewCount,
    approvedCount,
    enrolledCount,
    rejectedCount,
    submittedToday,
    totalStudents,
    totalCollections,
    recentEnrollments,
    activeSchoolYear,
  } = await getRegistrarDashboardData();

  const stats = [
    { label: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-600", border: "border-l-amber-500", href: "/registrar/enrollments?status=pending" },
    { label: "Under Review", value: underReviewCount, icon: Eye, color: "text-blue-600", border: "border-l-blue-500", href: "/registrar/enrollments?status=under_review" },
    { label: "Approved", value: approvedCount, icon: CheckCircle2, color: "text-emerald-600", border: "border-l-emerald-500", href: "/registrar/enrollments?status=approved" },
    { label: "Enrolled", value: enrolledCount, icon: GraduationCap, color: "text-purple-600", border: "border-l-purple-500", href: "/registrar/enrollments?status=enrolled" },
    { label: "Not Approved", value: rejectedCount, icon: XCircle, color: "text-red-600", border: "border-l-red-500", href: "/registrar/enrollments?status=rejected" },
    { label: "New Today", value: submittedToday, icon: ClipboardList, color: "text-teal-600", border: "border-l-teal-500", href: "/registrar/enrollments" },
    { label: "Total Students", value: totalStudents, icon: FileText, color: "text-indigo-600", border: "border-l-indigo-500", href: "/registrar/students" },
    { label: "Total Collections", value: formatCurrency(totalCollections), icon: CreditCard, color: "text-rose-600", border: "border-l-rose-500", href: "/registrar/payments" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <AutoRefresh intervalMs={30000} />

      <div>
        <h1 className="text-xl font-bold text-gray-900">Registrar Dashboard</h1>
        <p className="text-xs text-slate-500">
          {activeSchoolYear ? `School Year: ${(activeSchoolYear as any).name}` : "No active school year"} · {submittedToday} new application{submittedToday !== 1 ? "s" : ""} today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className={`border-l-4 ${s.border} hover:shadow-md transition-shadow cursor-pointer`}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                  <Icon className={`h-7 w-7 opacity-20 ${s.color}`} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/registrar/enrollments">
          <Button size="sm" className="ctk-danger-button gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Enrollment Applications
          </Button>
        </Link>
        <Link href="/registrar/students">
          <Button size="sm" variant="outline" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Students
          </Button>
        </Link>
        <Link href="/registrar/payments">
          <Button size="sm" variant="outline" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Payments
          </Button>
        </Link>
        <Link href="/registrar/reports">
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Reports
          </Button>
        </Link>
      </div>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
          <Link href="/registrar/enrollments">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recentEnrollments.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No enrollment applications yet.</p>
          ) : (
            <div className="space-y-2">
              {recentEnrollments.map((enr: any) => {
                const student = enr.studentId as any;
                const name = student?.personalInfo
                  ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
                  : "Unknown Student";
                return (
                  <Link key={String(enr._id)} href={`/registrar/enrollments/${enr._id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 hover:bg-slate-100 transition-colors">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{name}</p>
                        <p className="text-[11px] text-slate-500">{enr.gradeLevel} · {formatDate(enr.createdAt)}</p>
                      </div>
                      <Badge className={`ml-2 shrink-0 text-[10px] border ${statusColors[enr.status] ?? ""}`}>
                        {statusLabels[enr.status] ?? enr.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
