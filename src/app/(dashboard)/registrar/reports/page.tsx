import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
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
      <PageHeader title="Report Generation" description="Generate and export various reports" />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">Select Report Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <div key={report.type} className="rounded-xl border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold">{report.title}</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input type="date" className="ctk-input" />
                <Input type="date" className="ctk-input" />
              </div>
              <select className="ctk-input w-full border px-3 text-sm">
                <option>All Grade Levels</option>
              </select>
              <Button className="h-11 w-full ctk-danger-button">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report Preview
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                PDF Document
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                CSV Spreadsheet
              </Button>
            </CardContent>
          </Card>

          <Card className="ctk-panel border-amber-300 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-base font-bold text-primary">DepEd Reporting</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Student data reports are formatted according to DepEd requirements.
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
