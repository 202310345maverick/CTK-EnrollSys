import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Users, CreditCard, ClipboardList } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      title: "School Form 1 (SF1)",
      description: "School Register - List of all enrolled students",
      icon: Users,
      type: "sf1",
    },
    {
      title: "School Form 2 (SF2)",
      description: "Daily Attendance Report",
      icon: ClipboardList,
      type: "sf2",
    },
    {
      title: "Enrollment Summary",
      description: "Summary of enrollments by grade level and status",
      icon: FileText,
      type: "enrollment",
    },
    {
      title: "Payment Report",
      description: "Collection summary and payment history",
      icon: CreditCard,
      type: "payment",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Generate and download school reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.type}>
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
                    Preview
                  </Button>
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Reports</CardTitle>
          <CardDescription>Generate reports with custom date ranges and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
                <option>Enrollment Report</option>
                <option>Payment Report</option>
                <option>Student List</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">From Date</label>
              <input type="date" className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <input type="date" className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <Button className="mt-4">Generate Report</Button>
        </CardContent>
      </Card>
    </div>
  );
}
