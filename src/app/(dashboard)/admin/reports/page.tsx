"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader as _PageHeader } from "@/components/shared/page-header";
import {
  Loader2, Download, FileText, Users, CreditCard, ClipboardList,
  Filter, TableProperties, RefreshCw, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FormSelect } from "@/components/ui/form-select";
import { GRADE_LEVELS } from "@/lib/grade-levels";

// ─── Types ───────────────────────────────────────────────────────────────────

type EnrollmentRow = {
  no: number; enrollmentNumber: string; lrn: string; studentId: string;
  lastName: string; firstName: string; middleName: string; suffix: string;
  sex: string; birthDate: string; age: string; motherTongue: string;
  religion: string; address: string; guardianName: string; guardianContact: string;
  gradeLevel: string; section: string; status: string; enrollmentType: string;
  schoolYear: string; submittedAt: string; enrollmentDate: string;
};

type PaymentRow = {
  receiptNumber: string; referenceNumber: string; studentName: string; lrn: string;
  paymentType: string; amount: number; paymentDate: string | null;
  recordedBy: string; notes: string;
};

type ReportData = {
  schoolYears: { _id: string; name: string }[];
  total?: number;
  byGrade?: { grade: string; count: number }[];
  byStatus?: { status: string; count: number }[];
  rows?: EnrollmentRow[];
  payments?: {
    totalAmount: number; count: number; voidedCount: number; voidedAmount: number;
    byType: { type: string; amount: number; count: number }[];
    daily: { date: string; amount: number; count: number }[];
    list: PaymentRow[];
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND_RED: [number, number, number] = [180, 4, 13];
const SCHOOL_NAME = "Christ the King Catholic School";
const SCHOOL_SUBTITLE = "Enrollment Management System";

const STATUS_OPTIONS = ["pending","under_review","approved","rejected","enrolled"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", under_review: "Under Review", approved: "Approved",
  rejected: "Not Approved", enrolled: "Enrolled", draft: "Draft",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  enrolled: "bg-purple-100 text-purple-800 border-purple-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
};

const REPORT_TYPES = [
  { id: "enrollment", label: "Enrollment Summary", desc: "All enrollments with filters", icon: FileText },
  { id: "sf1",        label: "DepEd SF1",          desc: "School Register (enrolled students)", icon: TableProperties },
  { id: "sf2",        label: "DepEd SF2",          desc: "Daily Attendance Register template", icon: ClipboardList },
  { id: "payment",    label: "Payment Collection", desc: "Assessment & payment records", icon: CreditCard },
];

const inputCls = "h-8 text-xs w-full border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary bg-white";

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
  } catch { return null; }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("enrollment");
  const [filters, setFilters] = useState({ schoolYearId: "", gradeLevel: "", status: "", dateFrom: "", dateTo: "" });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"" | "excel" | "pdf" | "sf1pdf" | "sf2pdf">("");

  const buildUrl = useCallback((type: string, f: typeof filters) => {
    const p = new URLSearchParams({ type });
    if (f.schoolYearId) p.set("schoolYearId", f.schoolYearId);
    if (f.gradeLevel)   p.set("gradeLevel", f.gradeLevel);
    if (f.status)       p.set("status", f.status);
    if (f.dateFrom)     p.set("dateFrom", f.dateFrom);
    if (f.dateTo)       p.set("dateTo", f.dateTo);
    return `/api/reports?${p}`;
  }, []);

  const load = useCallback(async (type: string, f: typeof filters) => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(type, f));
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Load school years on mount only
  useEffect(() => { load(reportType, filters); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleRun = () => load(reportType, filters);

  const handleTypeChange = (t: string) => {
    setReportType(t);
    load(t, filters);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function pdfHeader(doc: any, title: string, subtitle: string, reportDate: string, logoBase64: string | null) {
    const pageW = doc.internal.pageSize.getWidth();
    if (logoBase64) { try { doc.addImage(logoBase64, "PNG", 8, 5, 16, 16); } catch { /**/ } }
    const textX = logoBase64 ? 27 : 8;
    doc.setTextColor(...BRAND_RED);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(SCHOOL_NAME, textX, 11);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Enrollment Management System", textX, 17);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(title, pageW - 8, 10, { align: "right" });
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6.5); doc.setFont("helvetica", "italic");
    doc.text(subtitle, pageW - 8, 16, { align: "right" });
    doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${reportDate}`, pageW - 8, 21, { align: "right" });
    doc.setDrawColor(...BRAND_RED);
    doc.setLineWidth(0.7);
    doc.line(8, 25, pageW - 8, 25);
    doc.setDrawColor(0); doc.setLineWidth(0.2);
  }

  function pdfFooterHook(doc: any) {
    return (hookData: any) => {
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...BRAND_RED);
      doc.setLineWidth(0.4);
      doc.line(8, pageH - 12, pageW - 8, pageH - 12);
      doc.setTextColor(...BRAND_RED);
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(SCHOOL_NAME, 8, pageH - 7.5);
      doc.setTextColor(130, 130, 130);
      doc.setFont("helvetica", "normal");
      doc.text(SCHOOL_SUBTITLE, 8, pageH - 3.5);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(`Page ${hookData.pageNumber}`, pageW - 8, pageH - 5.5, { align: "right" });
      doc.setDrawColor(0); doc.setLineWidth(0.2);
    };
  }

  // ── Excel Export ─────────────────────────────────────────────────────────────

  const downloadExcel = async () => {
    if (!data) return;
    setExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

      if (reportType === "payment") {
        const list = data.payments?.list || [];
        const wsData = [
          [SCHOOL_NAME, "", "", "", "", "", "", ""],
          ["Payment Collection Report", "", "", "", "", "", "", ""],
          [`Generated: ${reportDate}`, "", "", "", "", "", "", ""],
          [],
          ["Receipt #", "Reference #", "Student Name", "LRN", "Payment Type", "Amount (₱)", "Date", "Recorded By", "Notes"],
          ...list.map((p) => [
            p.receiptNumber, p.referenceNumber, p.studentName, p.lrn,
            p.paymentType, p.amount,
            p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-PH") : "",
            p.recordedBy, p.notes,
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Payments");
      } else {
        const rows = data.rows || [];
        const wsData = [
          [SCHOOL_NAME, "", "", "", "", "", "", "", ""],
          [reportType === "sf1" ? "School Form 1 (SF1) — School Register" : reportType === "sf2" ? "School Form 2 (SF2) — Daily Attendance Register" : "Enrollment Summary Report"],
          [`Generated: ${reportDate}`, "", "", "", "", "", "", "", ""],
          [],
          ["No.", "LRN", "Last Name", "First Name", "Middle Name", "Ext.", "Sex", "Birth Date", "Age", "Mother Tongue", "Religion", "Address", "Parent/Guardian", "Contact #", "Grade Level", "Section", "Status", "School Year", "Submitted"],
          ...rows.map((r) => [
            r.no, r.lrn, r.lastName, r.firstName, r.middleName, r.suffix,
            r.sex, r.birthDate, r.age, r.motherTongue, r.religion,
            r.address, r.guardianName, r.guardianContact,
            r.gradeLevel, r.section, r.status, r.schoolYear, r.submittedAt,
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [
          { wch: 5 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 6 },
          { wch: 5 }, { wch: 12 }, { wch: 5 }, { wch: 14 }, { wch: 12 },
          { wch: 30 }, { wch: 22 }, { wch: 14 },
          { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
        ];
        const sheetName = reportType === "sf1" ? "SF1" : reportType === "sf2" ? "SF2" : "Enrollments";
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Summary sheet
        if (data.byGrade && data.byStatus) {
          const sumData = [
            ["Enrollment Summary"],
            [],
            ["By Grade Level"],
            ["Grade", "Count"],
            ...(data.byGrade.map((g) => [g.grade, g.count])),
            [],
            ["By Status"],
            ["Status", "Count"],
            ...(data.byStatus.map((s) => [s.status.replace("_", " "), s.count])),
          ];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumData), "Summary");
        }
      }

      XLSX.writeFile(wb, `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`);
    } finally { setExporting(""); }
  };

  // ── PDF Export ───────────────────────────────────────────────────────────────

  const downloadPDF = async () => {
    if (!data) return;
    setExporting("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const logoBase64 = await getLogoBase64();
      const isPayment = reportType === "payment";
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      const titleMap: Record<string, string> = {
        enrollment: "Enrollment Summary Report",
        sf1: "SF1 — School Register",
        sf2: "SF2 — Attendance Register",
        payment: "Payment Collection Report",
      };
      const subtitleMap: Record<string, string> = {
        enrollment: "All enrollment applications",
        sf1: "DepEd School Form 1",
        sf2: "DepEd School Form 2",
        payment: "Assessment & payment records",
      };

      pdfHeader(doc, titleMap[reportType] || "Report", subtitleMap[reportType] || "", reportDate, logoBase64);
      const footerHook = pdfFooterHook(doc);

      if (isPayment) {
        const stats = data.payments;
        let y = 29;
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
        doc.text("Payment Summary", 8, y);
        autoTable(doc, {
          body: [
            ["Total Collections", `₱ ${(stats?.totalAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
            ["Total Transactions", String(stats?.count || 0)],
            ["Voided Transactions", String(stats?.voidedCount || 0)],
            ["Voided Amount", `₱ ${(stats?.voidedAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
          ],
          startY: y + 4,
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 248, 248] },
            1: { cellWidth: 60 },
          },
          tableLineColor: [220, 220, 220], tableLineWidth: 0.2,
          margin: { left: 8, right: 8 },
        });

        const y2 = (doc as any).lastAutoTable?.finalY + 8 || 72;
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
        doc.text("Transaction Details", 8, y2);
        autoTable(doc, {
          head: [["Receipt #", "Student Name", "LRN", "Type", "Amount (₱)", "Date", "Recorded By"]],
          body: (stats?.list || []).map((p) => [
            p.receiptNumber || "—",
            p.studentName,
            p.lrn || "—",
            p.paymentType,
            p.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
            p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-PH") : "—",
            p.recordedBy,
          ]),
          startY: y2 + 4,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          tableLineColor: [220, 220, 220], tableLineWidth: 0.2,
          columnStyles: {
            0: { cellWidth: 22 },  // Receipt #
            1: { cellWidth: 46 },  // Student Name
            2: { cellWidth: 18 },  // LRN
            3: { cellWidth: 22 },  // Type
            4: { cellWidth: 22, halign: "right" },  // Amount
            5: { cellWidth: 22 },  // Date
            6: { cellWidth: 42 },  // Recorded By
          },                       // Total: 194mm
          margin: { left: 8, right: 8 }, didDrawPage: footerHook,
        });
      } else {
        const rows = data.rows || [];
        let y = 29;
        if (data.byGrade?.length) {
          doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
          doc.text(`Total Records: ${rows.length}`, 8, y);
          const gradeText = (data.byGrade || []).map((g) => `${g.grade}: ${g.count}`).join("  ·  ");
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(110, 110, 110);
          doc.text(gradeText, 8, y + 5, { maxWidth: pageW - 16 });
          y += 12;
        }
        autoTable(doc, {
          head: [["#", "LRN", "Last Name", "First Name", "M.N.", "Sex", "Birth Date", "Age", "Grade", "Section", "Status", "School Year"]],
          body: rows.map((r) => [
            r.no, r.lrn, r.lastName, r.firstName, r.middleName,
            r.sex, r.birthDate, r.age, r.gradeLevel, r.section,
            STATUS_LABELS[r.status] || r.status, r.schoolYear,
          ]),
          startY: y,
          styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          tableLineColor: [220, 220, 220], tableLineWidth: 0.2,
          columnStyles: {
            0:  { cellWidth: 8,  halign: "center" },  // #
            1:  { cellWidth: 18 },                    // LRN
            2:  { cellWidth: 26 },                    // Last Name
            3:  { cellWidth: 22 },                    // First Name
            4:  { cellWidth: 14 },                    // M.N.
            5:  { cellWidth: 8,  halign: "center" },  // Sex
            6:  { cellWidth: 18 },                    // Birth Date
            7:  { cellWidth: 8,  halign: "center" },  // Age
            8:  { cellWidth: 18 },                    // Grade
            9:  { cellWidth: 14 },                    // Section
            10: { cellWidth: 22 },                    // Status
            11: { cellWidth: 18 },                    // School Year
          },                                          // Total: 194mm
          margin: { left: 8, right: 8 }, didDrawPage: footerHook,
        });
      }

      doc.save(`${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally { setExporting(""); }
  };

  // ── SF1 PDF ──────────────────────────────────────────────────────────────────

  const downloadSF1PDF = async () => {
    if (!data?.rows) return;
    setExporting("sf1pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const logoBase64 = await getLogoBase64();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const byGrade: Record<string, EnrollmentRow[]> = {};
      data.rows.forEach((r) => {
        if (!byGrade[r.gradeLevel]) byGrade[r.gradeLevel] = [];
        byGrade[r.gradeLevel].push(r);
      });

      let firstPage = true;
      for (const [grade, students] of Object.entries(byGrade)) {
        if (!firstPage) doc.addPage();
        firstPage = false;

        pdfHeader(doc, "School Form 1 — School Register", `Grade Level: ${grade}`, reportDate, logoBase64);

        autoTable(doc, {
          head: [["#", "LRN", "Last Name", "First Name", "M.N.", "Ext.", "Sex", "Birth Date", "Age", "Mother Tongue", "Religion", "Address", "Parent/Guardian", "Contact #", "Remarks"]],
          body: students.map((r, i) => [
            i + 1, r.lrn, r.lastName, r.firstName, r.middleName, r.suffix,
            r.sex, r.birthDate, r.age, r.motherTongue, r.religion,
            r.address, r.guardianName, r.guardianContact, "",
          ]),
          startY: 29,
          styles: { fontSize: 6.5, cellPadding: 1.8, overflow: "linebreak" },
          headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.5, halign: "center" },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          tableLineColor: [220, 220, 220], tableLineWidth: 0.2,
          columnStyles: {
            0:  { cellWidth: 6,  halign: "center" },  // #
            1:  { cellWidth: 15 },                    // LRN
            2:  { cellWidth: 20 },                    // Last Name
            3:  { cellWidth: 18 },                    // First Name
            4:  { cellWidth: 10 },                    // M.N.
            5:  { cellWidth: 6  },                    // Ext.
            6:  { cellWidth: 6,  halign: "center" },  // Sex
            7:  { cellWidth: 16 },                    // Birth Date
            8:  { cellWidth: 6,  halign: "center" },  // Age
            9:  { cellWidth: 14 },                    // Mother Tongue
            10: { cellWidth: 12 },                    // Religion
            11: { cellWidth: 30 },                    // Address
            12: { cellWidth: 18 },                    // Parent/Guardian
            13: { cellWidth: 13 },                    // Contact #
            14: { cellWidth: 8  },                    // Remarks
          },                                          // Total: 194mm
          margin: { left: 8, right: 8 },
          didDrawPage: (hookData: any) => {
            doc.setDrawColor(...BRAND_RED);
            doc.setLineWidth(0.4);
            doc.line(8, pageH - 12, pageW - 8, pageH - 12);
            doc.setTextColor(...BRAND_RED);
            doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
            doc.text(SCHOOL_NAME, 8, pageH - 7.5);
            doc.setTextColor(130, 130, 130);
            doc.setFont("helvetica", "normal");
            doc.text(`SF1 School Register  ·  Grade ${grade}`, 8, pageH - 3.5);
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(7); doc.setFont("helvetica", "bold");
            doc.text(`Page ${hookData.pageNumber}`, pageW - 8, pageH - 5.5, { align: "right" });
            doc.setDrawColor(0); doc.setLineWidth(0.2);
          },
        });
      }

      doc.save(`SF1-school-register-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally { setExporting(""); }
  };

  // ── SF2 PDF ──────────────────────────────────────────────────────────────────

  const downloadSF2PDF = async () => {
    if (!data?.rows) return;
    setExporting("sf2pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const reportDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const logoBase64 = await getLogoBase64();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const byGrade: Record<string, EnrollmentRow[]> = {};
      data.rows.forEach((r) => {
        if (!byGrade[r.gradeLevel]) byGrade[r.gradeLevel] = [];
        byGrade[r.gradeLevel].push(r);
      });

      let firstPage = true;
      for (const [grade, students] of Object.entries(byGrade)) {
        if (!firstPage) doc.addPage();
        firstPage = false;

        pdfHeader(doc, "School Form 2 — Attendance Register", `Grade Level: ${grade}`, reportDate, logoBase64);

        const dayHeaders = Array.from({ length: 31 }, (_, i) => String(i + 1));
        autoTable(doc, {
          head: [["#", "LRN", "Last Name", "First Name", "Sex", ...dayHeaders]],
          body: students.map((r, i) => [
            i + 1, r.lrn, r.lastName, r.firstName, r.sex,
            ...Array(31).fill(""),
          ]),
          startY: 29,
          styles: { fontSize: 5.5, cellPadding: 1, halign: "center" },
          headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 5.5 },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          tableLineColor: [220, 220, 220], tableLineWidth: 0.2,
          columnStyles: {
            0: { cellWidth: 5  },
            1: { cellWidth: 14, halign: "left" },
            2: { cellWidth: 17, halign: "left" },
            3: { cellWidth: 15, halign: "left" },
            4: { cellWidth: 5  },
            ...Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 5, { cellWidth: 4.5 }])),
          },
          margin: { left: 8, right: 8 },
          didDrawPage: (hookData: any) => {
            doc.setDrawColor(...BRAND_RED);
            doc.setLineWidth(0.4);
            doc.line(8, pageH - 12, pageW - 8, pageH - 12);
            doc.setTextColor(...BRAND_RED);
            doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
            doc.text(SCHOOL_NAME, 8, pageH - 7.5);
            doc.setTextColor(130, 130, 130);
            doc.setFont("helvetica", "normal");
            doc.text(`SF2 Daily Attendance Register  ·  Grade ${grade}`, 8, pageH - 3.5);
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(7); doc.setFont("helvetica", "bold");
            doc.text(`Page ${hookData.pageNumber}`, pageW - 8, pageH - 5.5, { align: "right" });
            doc.setDrawColor(0); doc.setLineWidth(0.2);
          },
        });
      }

      doc.save(`SF2-attendance-register-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally { setExporting(""); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const rows = data?.rows || [];
  const payments = data?.payments;
  const schoolYears = data?.schoolYears || [];
  const canExportPdf = rows.length > 0 || (payments?.list?.length || 0) > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin Reports</h1>
        <p className="text-xs text-slate-500">Generate, filter, and export administrative reports</p>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => handleTypeChange(r.id)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                reportType === r.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-white hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${reportType === r.id ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{r.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block truncate">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => { setFilters({ schoolYearId: "", gradeLevel: "", status: "", dateFrom: "", dateTo: "" }); }} disabled={loading}>
                <X className="h-3 w-3 mr-1" /> Reset Filters
              </Button>
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleRun} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Run Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {/* School Year */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-1">School Year</label>
              <FormSelect
                value={filters.schoolYearId || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, schoolYearId: v === "_all_" ? "" : v }))}
                options={[{ value: "_all_", label: "All school years" }, ...schoolYears.map((sy) => ({ value: sy._id, label: sy.name }))]}
                placeholder="All school years"
              />
            </div>
            {/* Grade Level — hidden for payment */}
            {reportType !== "payment" && (
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Grade Level</label>
                <FormSelect
                  value={filters.gradeLevel || undefined}
                  onChange={(v) => setFilters((f) => ({ ...f, gradeLevel: v === "_all_" ? "" : v }))}
                  options={[{ value: "_all_", label: "All grades" }, ...GRADE_LEVELS.map((g) => ({ value: g, label: g }))]}
                  placeholder="All grades"
                />
              </div>
            )}
            {/* Status — hidden for sf1/sf2 (forced to enrolled) */}
            {reportType !== "sf1" && reportType !== "sf2" && (
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">
                  {reportType === "payment" ? "Grade (N/A)" : "Status"}
                </label>
                {reportType !== "payment" ? (
                  <FormSelect
                    value={filters.status || undefined}
                    onChange={(v) => setFilters((f) => ({ ...f, status: v === "_all_" ? "" : v }))}
                    options={[{ value: "_all_", label: "All statuses" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s.replace("_", " ") }))]}
                    placeholder="All statuses"
                  />
                ) : (
                  <input className={inputCls} disabled placeholder="N/A for payments" />
                )}
              </div>
            )}
            {/* Date From */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-1">
                {reportType === "payment" ? "Payment Date From" : "Submitted From"}
              </label>
              <input type="date" className={inputCls} value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            {/* Date To */}
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-1">
                {reportType === "payment" ? "Payment Date To" : "Submitted To"}
              </label>
              <input type="date" className={inputCls} value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
            </div>
          </div>
          {(reportType === "sf1" || reportType === "sf2") && (
            <p className="mt-2 text-[10px] text-amber-600">
              SF1 and SF2 automatically filter to enrolled students only.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        {/* Preview */}
        <Card className="min-h-[300px]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {REPORT_TYPES.find((r) => r.id === reportType)?.label} Preview
                {!loading && data && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {reportType === "payment"
                      ? `(${payments?.list?.length || 0} records)`
                      : `(${rows.length} records)`}
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : reportType === "payment" && payments ? (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Collections", value: formatCurrency(payments.totalAmount), color: "text-emerald-600" },
                    { label: "Transactions", value: payments.count, color: "text-blue-600" },
                    { label: "Voided Count", value: payments.voidedCount, color: "text-red-600" },
                    { label: "Voided Amount", value: formatCurrency(payments.voidedAmount), color: "text-red-600" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border p-2.5">
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {/* Payment list table */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Receipt #", "Student Name", "Type", "Amount", "Date", "Recorded By"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.list.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No records found</td></tr>
                      ) : payments.list.slice(0, 50).map((p, i) => (
                        <tr key={i} className="border-t hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 font-mono text-[10px]">{p.receiptNumber || "—"}</td>
                          <td className="px-3 py-1.5">{p.studentName}</td>
                          <td className="px-3 py-1.5 capitalize">{p.paymentType}</td>
                          <td className="px-3 py-1.5 font-semibold text-emerald-700">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-1.5">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-PH") : "—"}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{p.recordedBy}</td>
                        </tr>
                      ))}
                      {payments.list.length > 50 && (
                        <tr><td colSpan={6} className="py-2 text-center text-xs text-muted-foreground">Showing first 50 of {payments.list.length} — export for full list</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : rows.length > 0 ? (
              <div className="space-y-4">
                {/* Summary badges */}
                {data?.byStatus && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.byStatus.map((s) => (
                      <span key={s.status} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[s.status] ?? s.status.replace("_", " ")} · {s.count}
                      </span>
                    ))}
                  </div>
                )}
                {/* Grade summary */}
                {data?.byGrade && (
                  <div className="space-y-1.5">
                    {data.byGrade.map((g) => (
                      <div key={g.grade} className="flex items-center gap-2">
                        <span className="w-20 text-[10px] text-muted-foreground truncate">{g.grade}</span>
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(100, (g.count / (data.total || 1)) * 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-medium w-5 text-right">{g.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Scrollable table */}
                <div className="overflow-x-auto rounded-lg border max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr>
                        {["#", "LRN", "Last Name", "First Name", "M.N.", "Sex", "Grade", "Section", "Status", "School Year", "Submitted"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 border-b">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 100).map((r) => (
                        <tr key={r.enrollmentNumber} className="border-t hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 text-muted-foreground">{r.no}</td>
                          <td className="px-3 py-1.5 font-mono text-[10px]">{r.lrn}</td>
                          <td className="px-3 py-1.5 font-medium">{r.lastName}</td>
                          <td className="px-3 py-1.5">{r.firstName}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{r.middleName}</td>
                          <td className="px-3 py-1.5">{r.sex}</td>
                          <td className="px-3 py-1.5">{r.gradeLevel}</td>
                          <td className="px-3 py-1.5">{r.section}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}`}>
                              {STATUS_LABELS[r.status] ?? r.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">{r.schoolYear}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{r.submittedAt}</td>
                        </tr>
                      ))}
                      {rows.length > 100 && (
                        <tr><td colSpan={11} className="py-2 text-center text-xs text-muted-foreground">Showing first 100 of {rows.length} — export for full list</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data. Adjust filters and click Run Report.</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Export panel */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs gap-2"
                onClick={downloadExcel} disabled={!!exporting || !canExportPdf}>
                {exporting === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-emerald-600" />}
                <span><span className="font-semibold">Excel</span> (.xlsx)</span>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs gap-2"
                onClick={downloadPDF} disabled={!!exporting || !canExportPdf}>
                {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-red-600" />}
                <span><span className="font-semibold">PDF</span> (standard)</span>
              </Button>
              {(reportType === "enrollment" || reportType === "sf1" || reportType === "sf2") && (
                <>
                  <hr className="my-1" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">DepEd Forms</p>
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs gap-2"
                    onClick={downloadSF1PDF} disabled={!!exporting || rows.length === 0}>
                    {exporting === "sf1pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TableProperties className="h-3.5 w-3.5 text-blue-600" />}
                    <span><span className="font-semibold">SF1</span> School Register PDF</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs gap-2"
                    onClick={downloadSF2PDF} disabled={!!exporting || rows.length === 0}>
                    {exporting === "sf2pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5 text-blue-600" />}
                    <span><span className="font-semibold">SF2</span> Attendance Register PDF</span>
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    SF1/SF2 use enrolled students. Run with <em>SF1</em> or <em>SF2</em> report type, or use the enrollment report and export.
                  </p>
                </>
              )}
              {!canExportPdf && !loading && (
                <p className="text-[10px] text-muted-foreground mt-1">Run report first to enable export.</p>
              )}
            </CardContent>
          </Card>

          {/* By-grade summary card */}
          {data?.byGrade && data.byGrade.length > 0 && (
            <Card>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">By Grade Level</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-1">
                  {data.byGrade.map((g) => (
                    <div key={g.grade} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[140px]">{g.grade}</span>
                      <span className="font-semibold">{g.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment by-type summary */}
          {payments?.byType && payments.byType.length > 0 && (
            <Card>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">By Payment Type</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-1">
                  {payments.byType.map((t) => (
                    <div key={t.type} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{t.type}</span>
                      <span className="font-semibold">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
