import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, CheckCircle, XCircle, Users, FileText } from "lucide-react";
import Link from "next/link";

export default function RegistrarDashboard() {
  const stats = [
    {
      title: "Pending Review",
      value: "23",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Under Review",
      value: "8",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Approved Today",
      value: "12",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Rejected",
      value: "2",
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  const pendingEnrollments = [
    { id: 1, name: "Maria Santos Dela Cruz", grade: "Grade 3", type: "New", date: "Mar 15, 2024" },
    { id: 2, name: "Juan Carlos Reyes", grade: "Grade 1", type: "Transferee", date: "Mar 15, 2024" },
    { id: 3, name: "Ana Marie Garcia", grade: "Kinder 2", type: "New", date: "Mar 14, 2024" },
    { id: 4, name: "Pedro Santos Jr.", grade: "Grade 5", type: "Returning", date: "Mar 14, 2024" },
    { id: 5, name: "Sofia Isabelle Cruz", grade: "Grade 2", type: "New", date: "Mar 13, 2024" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registrar Dashboard</h2>
          <p className="text-muted-foreground">
            Process enrollments and manage student records
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/registrar/students">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Students
            </Button>
          </Link>
          <Link href="/registrar/reports">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Enrollments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending Enrollments</CardTitle>
            <CardDescription>Applications awaiting your review</CardDescription>
          </div>
          <Link href="/registrar/enrollments">
            <Button>View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{enrollment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {enrollment.grade} • {enrollment.type} Student
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-muted-foreground">{enrollment.date}</p>
                </div>
                <Link href={`/registrar/enrollments/${enrollment.id}`}>
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
