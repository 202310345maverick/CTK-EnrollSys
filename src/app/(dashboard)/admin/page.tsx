import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CreditCard, TrendingUp, UserCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Pending Enrollments",
      value: "45",
      change: "+5",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Approved Today",
      value: "12",
      change: "+8",
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Payments",
      value: "₱2.5M",
      change: "+18%",
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System overview and management" />

      <StatsGrid
        items={stats.map((stat) => ({
          title: stat.title,
          value: stat.value,
          icon: stat.icon,
          change: `${stat.change} from last month`,
          iconClassName: stat.color,
          iconBgClassName: stat.bg,
        }))}
      />

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="ctk-panel">
          <CardHeader>
            <CardTitle className="ctk-section-title">Recent Enrollments</CardTitle>
            <CardDescription>Latest enrollment applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Maria Santos Dela Cruz</p>
                    <p className="text-sm text-muted-foreground">Grade 3 - New Student</p>
                  </div>
                    <Badge variant="pending">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        <Card className="ctk-panel">
          <CardHeader>
            <CardTitle className="ctk-section-title">Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Juan Dela Cruz Jr.</p>
                    <p className="text-sm text-muted-foreground">First Quarter Payment</p>
                  </div>
                  <span className="font-medium text-green-600">₱6,250</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
