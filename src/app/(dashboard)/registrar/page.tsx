import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import "@/models/Student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, CheckCircle, XCircle, Users, Eye, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingCount, underReviewCount, approvedCount, rejectedCount, enrolledCount, totalStudents, recentPending, submittedToday, enrolledToday, typeBreakdownRaw] =
    await Promise.all([
      Enrollment.countDocuments({ status: "pending" }),
      Enrollment.countDocuments({ status: "under_review" }),
      Enrollment.countDocuments({ status: "approved" }),
      Enrollment.countDocuments({ status: "rejected" }),
      Enrollment.countDocuments({ status: "enrolled" }),
      Student.countDocuments(),
      Enrollment.find({ status: { $in: ["pending", "under_review"] } })
        .populate("studentId", "personalInfo")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Enrollment.countDocuments({ createdAt: { $gte: today }, status: { $ne: "draft" } }),
      Enrollment.countDocuments({ status: "enrolled", updatedAt: { $gte: today } }),
      Enrollment.aggregate([
        { $match: { status: { $ne: "draft" } } },
        { $group: { _id: "$enrollmentType", count: { $sum: 1 } } },
      ]),
    ]);

  const typeBreakdown: Record<string, number> = {};
  for (const item of typeBreakdownRaw) {
    if (item._id) typeBreakdown[item._id] = item.count;
  }

  return { pendingCount, underReviewCount, approvedCount, rejectedCount, enrolledCount, totalStudents, recentPending, submittedToday, enrolledToday, typeBreakdown };
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default async function RegistrarDashboard() {
  await getServerSession(authOptions);
  const { pendingCount, underReviewCount, approvedCount, rejectedCount, enrolledCount, totalStudents, recentPending, submittedToday, enrolledToday, typeBreakdown } =
    await getDashboardData();

  const stats = [
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", border: "border-l-amber-500" },
    { label: "Under Review", value: underReviewCount, icon: ClipboardList, color: "text-blue-600", border: "border-l-blue-500" },
    { label: "Approved", value: approvedCount, icon: CheckCircle, color: "text-emerald-600", border: "border-l-emerald-500" },
    { label: "Not Approved", value: rejectedCount, icon: XCircle, color: "text-red-600", border: "border-l-red-500" },
    { label: "Enrolled", value: enrolledCount, icon: CheckCircle, color: "text-purple-600", border: "border-l-purple-500" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-slate-600", border: "border-l-slate-400" },
    { label: "Submitted Today", value: submittedToday, icon: TrendingUp, color: "text-cyan-600", border: "border-l-cyan-500" },
    { label: "Enrolled Today", value: enrolledToday, icon: CheckCircle2, color: "text-teal-600", border: "border-l-teal-500" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    enrolled: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registrar Dashboard</h1>
        <p className="text-xs text-slate-500">Enrollment and records management overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border-l-4 ${s.border}`}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enrollment Breakdown by Type */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { key: "new", label: "New Students", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { key: "returning", label: "Returning", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { key: "transferee", label: "Transferees", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        ].map(({ key, label, color, bg, border }) => (
          <Card key={key} className={`border ${border} ${bg}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{typeBreakdown[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Queue */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" />
              Pending &amp; Under Review
            </CardTitle>
            <Link href="/registrar/enrollments">
              <Button size="sm" variant="outline" className="h-7 text-xs px-2">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recentPending.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No pending enrollments.</p>
          ) : (
            <div className="space-y-1.5">
              {recentPending.map((enrollment: any) => {
                const student = enrollment.studentId;
                const name = student?.personalInfo
                  ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
                  : "Draft application";
                const statusClass = statusColors[enrollment.status] || "bg-slate-100 text-slate-800";
                return (
                  <div key={enrollment._id} className="flex items-center gap-3 rounded-lg border bg-slate-50/50 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.enrollmentNumber} • {enrollment.gradeLevel || "—"} •{" "}
                        <span className="capitalize">{enrollment.enrollmentType || "—"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(enrollment.createdAt)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                        {{ pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Not Approved", enrolled: "Enrolled" }[enrollment.status as string] ?? enrollment.status.replace("_", " ")}
                      </span>
                      <Link href={`/registrar/enrollments/${enrollment._id}`}>
                        <Button size="sm" className="h-6 px-2 text-xs bg-[#b4040d] hover:bg-[#b4040d]/90">
                          <Eye className="mr-1 h-3 w-3" />
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
