import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Users, CreditCard, ClipboardList, TrendingUp } from "lucide-react";
import ExportDemo from "@/components/ExportDemo";
import { formatCurrency } from "@/lib/utils";

async function getReportStats() {
  await dbConnect();
  
  const [
    totalUsers,
    totalStudents,
    totalEnrollments,
    totalPayments,
    enrollmentsByGrade,
    enrollmentsByStatus,
  ] = await Promise.all([
    User.countDocuments(),
    Student.countDocuments(),
    Enrollment.countDocuments(),
    Payment.aggregate([
      { $match: { isVoided: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Enrollment.aggregate([
      { $group: { _id: "$gradeLevel", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalEnrollments,
    totalPayments: totalPayments[0]?.total || 0,
    enrollmentsByGrade,
    enrollmentsByStatus,
  };
}

export default async function AdminReportsPage() {
  const stats = await getReportStats();

  const systemReports = [
    {
      title: "User Activity Report",
      description: "Login history and user activity logs",
      icon: Users,
    },
    {
      title: "Enrollment Analytics",
      description: "Enrollment trends and statistics",
      icon: TrendingUp,
    },
    {
      title: "Financial Summary",
      description: "Revenue and collection reports",
      icon: CreditCard,
    },
    {
      title: "Audit Log",
      description: "System changes and audit trail",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Reports</h2>
        <p className="text-muted-foreground">
          View analytics and generate administrative reports
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPayments)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment by Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrollments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enrollmentsByStatus.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No enrollment data</p>
            ) : (
              <div className="space-y-3">
                {stats.enrollmentsByStatus.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="capitalize">{item._id?.replace("_", " ") || "Unknown"}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollments by Grade Level</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enrollmentsByGrade.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No enrollment data</p>
            ) : (
              <div className="space-y-3">
                {stats.enrollmentsByGrade.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span>{item._id || "Unknown"}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid gap-4 md:grid-cols-2">
        {systemReports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <ExportDemo reportKey={report.title} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
