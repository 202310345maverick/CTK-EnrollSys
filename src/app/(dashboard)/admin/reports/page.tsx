"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Users, CreditCard, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ReportStats = {
  totalUsers: number;
  totalStudents: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  enrollmentsByGrade: { grade: string; count: number }[];
  enrollmentsByStatus: { status: string; count: number }[];
  totalPayments: number;
  recentPayments: any[];
};

const BRAND_RED: [number, number, number] = [180, 4, 13];
const SCHOOL_NAME = "Christ the King Catholic School";
const SCHOOL_SUBTITLE = "Enrollment Management System";

async function getLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/images/ctk.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  enrolled: "bg-purple-100 text-purple-800",
  draft: "bg-slate-100 text-slate-600",
};

export default function AdminReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("enrollment");
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/reports");
        const data = await res.json();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const triggerCSVDownload = (csv: string, name: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = async () => {
    if (!stats) return;
    setDownloadingCsv(true);
    try {
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      if (selectedType === "enrollment") {
        const metaRows = [
          [`${SCHOOL_NAME} — ${SCHOOL_SUBTITLE}`],
          ["Enrollment Report"],
          [`Generated: ${reportDate}`],
          [],
          ["Grade Level", "Count"],
        ];
        const rows = stats.enrollmentsByGrade.map((e) => [e.grade, e.count]);
        const csv = [...metaRows, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        triggerCSVDownload(csv, "admin-enrollment-report");
      } else {
        const metaRows = [
          [`${SCHOOL_NAME} — ${SCHOOL_SUBTITLE}`],
          ["Payment Report"],
          [`Generated: ${reportDate}`],
          [],
          ["Total Payments", formatCurrency(stats.totalPayments)],
        ];
        const csv = metaRows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        triggerCSVDownload(csv, "admin-payment-report");
      }
    } finally {
      setDownloadingCsv(false);
    }
  };

  const downloadPDF = async () => {
    if (!stats) return;
    setDownloadingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const logoBase64 = await getLogoBase64();

      doc.setFillColor(...BRAND_RED);
      doc.rect(0, 0, pageW, 22, "F");
      if (logoBase64) {
        try { doc.addImage(logoBase64, "PNG", 6, 2, 18, 18); } catch { /* skip */ }
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(SCHOOL_NAME, logoBase64 ? 28 : 10, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(SCHOOL_SUBTITLE, logoBase64 ? 28 : 10, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(selectedType === "enrollment" ? "Enrollment Report" : "Payment Report", pageW - 8, 10, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Generated: ${reportDate}`, pageW - 8, 16, { align: "right" });

      let head: string[][];
      let body: (string | number)[][];

      if (selectedType === "enrollment") {
        head = [["Grade Level", "Count"]];
        body = stats.enrollmentsByGrade.map((e) => [e.grade, e.count]);
      } else {
        head = [["Metric", "Value"]];
        body = [
          ["Total Payments", formatCurrency(stats.totalPayments)],
          ["Total Enrollments", stats.totalEnrollments],
          ["Pending Enrollments", stats.pendingEnrollments],
          ["Total Students", stats.totalStudents],
          ["Total Users", stats.totalUsers],
        ];
      }

      autoTable(doc, {
        head,
        body,
        startY: 26,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [253, 240, 240] },
        margin: { left: 8, right: 8 },
        didDrawPage: (hookData: any) => {
          doc.setFillColor(...BRAND_RED);
          doc.rect(0, pageH - 10, pageW, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(`${SCHOOL_NAME} · Enrollment Management System`, pageW / 2, pageH - 4, { align: "center" });
          doc.text(`Page ${hookData.pageNumber}`, pageW - 8, pageH - 4, { align: "right" });
        },
      });

      doc.save(`admin-${selectedType}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const reports = [
    { title: "Enrollment Summary", description: "Enrollments by grade level and status", icon: FileText, type: "enrollment" },
    { title: "System Overview", description: "Users, students, and overall statistics", icon: Users, type: "overview" },
    { title: "Payment Report", description: "Collection summary and totals", icon: CreditCard, type: "payment" },
    { title: "Audit Trail", description: "System activity logs", icon: ClipboardList, type: "audit" },
  ];

  const canExport = selectedType === "enrollment" || selectedType === "payment";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Reports</h1>
        <p className="text-xs text-slate-500">Generate and export administrative reports</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: stats.totalUsers, color: "text-blue-600", border: "border-l-blue-500" },
            { label: "Total Students", value: stats.totalStudents, color: "text-emerald-600", border: "border-l-emerald-500" },
            { label: "Total Enrollments", value: stats.totalEnrollments, color: "text-amber-600", border: "border-l-amber-500" },
            { label: "Total Collections", value: formatCurrency(stats.totalPayments), color: "text-purple-600", border: "border-l-purple-500" },
          ].map((s) => (
            <Card key={s.label} className={`border-l-4 ${s.border}`}>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Report selector */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Select Report</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {reports.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.type}
                    onClick={() => setSelectedType(r.type)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedType === r.type ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${selectedType === r.type ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Report Preview</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : selectedType === "enrollment" && stats ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Status</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.enrollmentsByStatus.map((s) => (
                        <span key={s.status} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}>
                          {s.status.replace("_", " ")} <span className="font-bold">{s.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Grade Level</p>
                    <div className="space-y-1.5">
                      {stats.enrollmentsByGrade.map((g) => (
                        <div key={g.grade} className="flex items-center gap-2">
                          <span className="text-xs w-24 text-muted-foreground truncate">{g.grade}</span>
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5" style={{ width: `${stats.totalEnrollments ? Math.min(100, (g.count / stats.totalEnrollments) * 100) : 0}%` }} />
                          </div>
                          <span className="text-xs font-medium w-6 text-right">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedType === "payment" && stats ? (
                <div className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total Collections</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalPayments)}</p>
                  </div>
                </div>
              ) : selectedType === "overview" && stats ? (
                <div className="space-y-2">
                  {[
                    ["Total Users", stats.totalUsers],
                    ["Total Students", stats.totalStudents],
                    ["Total Enrollments", stats.totalEnrollments],
                    ["Pending Enrollments", stats.pendingEnrollments],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">This report type is not yet available for preview.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Export</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={downloadCSV} disabled={downloadingCsv || !canExport}>
                {downloadingCsv ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                Download CSV
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={downloadPDF} disabled={downloadingPdf || !canExport}>
                {downloadingPdf ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                Download PDF
              </Button>
              {!canExport && (
                <p className="text-xs text-muted-foreground">Select Enrollment or Payment report to export.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
