"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Loader2, Download, FileText, Users, CreditCard, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type EnrollmentStats = {
  byGrade: { grade: string; count: number }[];
  byStatus: { status: string; count: number }[];
  total: number;
};

type PaymentStats = {
  totalAmount: number;
  count: number;
  byMethod: { method: string; amount: number }[];
};

const BRAND_RED: [number, number, number] = [180, 4, 13]; // #b4040d
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

export default function ReportsPage() {
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("enrollment");
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [eRes, pRes] = await Promise.all([
          fetch("/api/enrollments?limit=500"),
          fetch("/api/payments?limit=500"),
        ]);
        const eData = await eRes.json();
        const pData = await pRes.json();

        const enrollments: any[] = eData.enrollments || [];
        const payments: any[] = pData.payments || [];

        const gradeMap: Record<string, number> = {};
        const statusMap: Record<string, number> = {};
        enrollments.forEach((e) => {
          const g = e.gradeLevel || "Unknown";
          const s = e.status || "unknown";
          gradeMap[g] = (gradeMap[g] || 0) + 1;
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        setEnrollmentStats({
          total: enrollments.length,
          byGrade: Object.entries(gradeMap).sort().map(([grade, count]) => ({ grade, count })),
          byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        });

        const methodMap: Record<string, number> = {};
        let totalAmt = 0;
        payments.forEach((p) => {
          const m = p.paymentMethod || "other";
          methodMap[m] = (methodMap[m] || 0) + p.amount;
          totalAmt += p.amount || 0;
        });
        setPaymentStats({
          totalAmount: totalAmt,
          count: payments.length,
          byMethod: Object.entries(methodMap).map(([method, amount]) => ({ method, amount })),
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const downloadCSV = async () => {
    setDownloadingCsv(true);
    try {
      const isPayment = selectedType === "payment";
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

      if (isPayment) {
        const res = await fetch("/api/payments?limit=1000");
        const data = await res.json();
        const payments: any[] = data.payments || [];

        const metaRows = [
          [`${SCHOOL_NAME} — ${SCHOOL_SUBTITLE}`],
          ["Payment Report"],
          [`Generated: ${reportDate}`],
          [],
          ["Receipt #", "Student Name", "Student ID", "Description", "Payment Type", "Method", "Amount", "Date"],
        ];
        const rows = payments.map((p) => [
          p.receiptNumber || "",
          `${p.studentId?.personalInfo?.lastName || ""}, ${p.studentId?.personalInfo?.firstName || ""}`,
          p.studentId?.studentId || "",
          p.description || "",
          p.paymentType || "",
          (p.paymentMethod || "").replace("_", " "),
          p.amount?.toFixed(2) || "0.00",
          p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-PH") : "",
        ]);
        const csv = [...metaRows, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        triggerCSVDownload(csv, "payment-report");
      } else {
        const res = await fetch("/api/enrollments?limit=1000");
        const data = await res.json();
        const enrollments: any[] = data.enrollments || [];

        const metaRows = [
          [`${SCHOOL_NAME} — ${SCHOOL_SUBTITLE}`],
          ["Enrollment Report"],
          [`Generated: ${reportDate}`],
          [],
          ["Student Name", "Grade Level", "Status", "Enrollment Type", "Submitted At"],
        ];
        const rows = enrollments.map((e) => [
          e.studentName || "",
          e.gradeLevel || "",
          (e.status || "").replace("_", " "),
          e.enrollmentType || "",
          e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-PH") : "",
        ]);
        const csv = [...metaRows, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        triggerCSVDownload(csv, "enrollment-report");
      }
    } finally {
      setDownloadingCsv(false);
    }
  };

  const triggerCSVDownload = (csv: string, name: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const isPayment = selectedType === "payment";
      const reportDate = new Date().toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const logoBase64 = await getLogoBase64();

      // ── Header ──
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

      // Report title + date (right side)
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(isPayment ? "Payment Report" : "Enrollment Report", pageW - 8, 10, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Generated: ${reportDate}`, pageW - 8, 16, { align: "right" });

      // ── Table ──
      let head: string[][];
      let body: (string | number)[][];

      if (isPayment) {
        const res = await fetch("/api/payments?limit=1000");
        const data = await res.json();
        const payments: any[] = data.payments || [];
        head = [["Receipt #", "Student Name", "Student ID", "Description", "Payment Type", "Method", "Amount (₱)", "Date"]];
        body = payments.map((p) => [
          p.receiptNumber || "—",
          `${p.studentId?.personalInfo?.lastName || ""}, ${p.studentId?.personalInfo?.firstName || ""}`,
          p.studentId?.studentId || "—",
          p.description || "",
          p.paymentType || "",
          (p.paymentMethod || "").replace("_", " "),
          p.amount?.toFixed(2) || "0.00",
          p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-PH") : "",
        ]);
      } else {
        const res = await fetch("/api/enrollments?limit=1000");
        const data = await res.json();
        const enrollments: any[] = data.enrollments || [];
        head = [["Student Name", "Grade Level", "Status", "Enrollment Type", "Submitted At"]];
        body = enrollments.map((e) => [
          e.studentName || "—",
          e.gradeLevel || "—",
          (e.status || "").replace("_", " "),
          e.enrollmentType || "—",
          e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-PH") : "—",
        ]);
      }

      autoTable(doc, {
        head,
        body,
        startY: 26,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: {
          fillColor: BRAND_RED,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [253, 240, 240] },
        margin: { left: 8, right: 8 },
        didDrawPage: (hookData: any) => {
          // ── Footer on every page ──
          doc.setFillColor(...BRAND_RED);
          doc.rect(0, pageH - 10, pageW, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(
            `${SCHOOL_NAME} · Enrollment Management System`,
            pageW / 2,
            pageH - 4,
            { align: "center" }
          );
          doc.text(
            `Page ${hookData.pageNumber}`,
            pageW - 8,
            pageH - 4,
            { align: "right" }
          );
        },
      });

      doc.save(`${isPayment ? "payment" : "enrollment"}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const reports = [
    { title: "Enrollment Summary", description: "Enrollments by grade level and status", icon: FileText, type: "enrollment" },
    { title: "Payment Report", description: "Collection summary and payment totals", icon: CreditCard, type: "payment" },
    { title: "School Form 1 (SF1)", description: "School Register — enrolled students list", icon: Users, type: "sf1" },
    { title: "School Form 2 (SF2)", description: "Daily Attendance Report", icon: ClipboardList, type: "sf2" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    enrolled: "bg-purple-100 text-purple-800",
    draft: "bg-slate-100 text-slate-600",
    waitlisted: "bg-orange-100 text-orange-800",
  };

  const canExport = selectedType === "enrollment" || selectedType === "payment";

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Generate and export school reports" />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Report type selector */}
          <Card className="ctk-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Select Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.type}
                    onClick={() => setSelectedType(r.type)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedType === r.type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
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

          {/* Report preview */}
          <Card className="ctk-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : selectedType === "enrollment" && enrollmentStats ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{enrollmentStats.total}</span> enrollments</p>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Status</p>
                    <div className="flex flex-wrap gap-2">
                      {enrollmentStats.byStatus.map((s) => (
                        <span key={s.status} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}>
                          {s.status.replace("_", " ")} <span className="font-bold">{s.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Grade Level</p>
                    <div className="space-y-1.5">
                      {enrollmentStats.byGrade.map((g) => (
                        <div key={g.grade} className="flex items-center gap-2">
                          <span className="text-xs w-24 text-muted-foreground truncate">{g.grade}</span>
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${Math.min(100, (g.count / enrollmentStats.total) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-6 text-right">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedType === "payment" && paymentStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total Collections</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(paymentStats.totalAmount)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-lg font-bold">{paymentStats.count}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Payment Method</p>
                    {paymentStats.byMethod.map((m) => (
                      <div key={m.method} className="flex items-center justify-between py-1 border-b last:border-0">
                        <span className="text-xs capitalize">{m.method.replace("_", " ")}</span>
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  This report type is not yet available for preview.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="ctk-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={downloadCSV}
                disabled={downloadingCsv || !canExport}
              >
                {downloadingCsv ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={downloadPDF}
                disabled={downloadingPdf || !canExport}
              >
                {downloadingPdf ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                Download PDF
              </Button>
              {!canExport && (
                <p className="text-xs text-muted-foreground">Select Enrollment or Payment report to export.</p>
              )}
            </CardContent>
          </Card>

          <Card className="ctk-panel border-amber-300 bg-amber-50/40">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-primary mb-1">DepEd Reporting</p>
              <p className="text-xs text-muted-foreground">
                Student data reports are formatted according to DepEd requirements for SF1 and SF2.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
