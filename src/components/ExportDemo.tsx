"use client";

import React from "react";

interface Props { reportKey?: string }

function arrayToCSV(rows: any[]) {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",") + "\n";
  const csv = rows.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return "";
    return String(v).replace(/"/g, '""');
  }).map(cell => `"${cell}"`).join(",")).join("\n");
  return header + csv;
}

export default function ExportDemo({ reportKey }: Props) {
  const handleExport = () => {
    // Try to load demo enrollments from localStorage
    const demo = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("demo_enrollments") || "null") : null;

    const sample = demo && demo.length > 0 ? demo : [
      { enrollmentNumber: "ENR-2024-0342", studentName: "Maria Santos", gradeLevel: "Grade 7", status: "pending", submitted: "2024-04-03" },
      { enrollmentNumber: "ENR-2024-0341", studentName: "Juan Dela Cruz", gradeLevel: "Grade 8", status: "approved", submitted: "2024-04-01" },
    ];

    // Normalize rows
    const rows = (sample as any[]).map(s => ({
      EnrollmentID: s.enrollmentNumber || s.id || "",
      Student: s.studentName || (s.student && `${s.student.firstName} ${s.student.lastName}`) || "",
      Grade: s.gradeLevel || "",
      Status: s.status || "",
      Submitted: s.createdAt ? new Date(s.createdAt).toLocaleString() : s.submitted || "",
    }));

    const csv = arrayToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(reportKey || 'report').replace(/\s+/g, "_").toLowerCase()}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0-8l3 3m-3-3-3 3" />
      </svg>
      Export
    </button>
  );
}
