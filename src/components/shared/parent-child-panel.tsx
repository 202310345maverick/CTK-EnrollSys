"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import ParentDashboardDocuments from "@/components/shared/parent-dashboard-documents";

export type ChildDocument = {
  type: string;
  label: string;
  status: "pending" | "verified" | "rejected" | "missing";
  uploadedAt: string | Date | null;
  downloadUrl: string | null;
  filename: string | null;
  aiAnalysis?: { status: string; qualityFlags?: string[] } | null;
};

export type ChildEnrollmentData = {
  studentId: string;
  studentName: string;
  enrollment: {
    id: string;
    enrollmentNumber: string;
    gradeLevel: string;
    status: string;
    submittedAt: string;
    remark: string | null;
  } | null;
  documents: ChildDocument[];
};

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review": return "Under Review";
    case "approved":     return "Approved";
    case "rejected":     return "Rejected";
    case "enrolled":     return "Enrolled";
    case "pending":      return "Pending";
    default:             return status;
  }
}

export default function ParentChildPanel({ childData }: { childData: ChildEnrollmentData[] }) {
  const [selectedId, setSelectedId] = useState(childData[0]?.studentId ?? "");
  const selected = childData.find((c) => c.studentId === selectedId) ?? childData[0];

  if (!childData.length) {
    return (
      <Card className="min-w-0 overflow-hidden border border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No Enrollments Yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Start your first enrollment application.</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/parent/enrollment/new">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Start New Enrollment
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {/* Child selector + New Enrollment button */}
      <div className="flex items-center gap-3">
        {childData.length > 1 ? (
          <div className="min-w-0 flex-1">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {childData.map((c) => (
                  <TableRow key={c.studentId}>
                    <TableCell className="font-semibold">{c.studentName}</TableCell>
                    <TableCell>{c.enrollment?.gradeLevel ?? c.currentGradeLevel ?? "—"}</TableCell>
                    <TableCell>{c.enrollment?.enrollmentNumber ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className="shrink-0 border-0 px-2 py-0.5 text-xs font-medium" variant="neutral">
                        {getStatusLabel(c.enrollment?.status ?? "pending")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.enrollment?.id ? (
                        <Link href={`/parent/enrollments/${c.enrollment.id}`} className="text-primary text-xs font-medium">View</Link>
                      ) : (
                        <Link href="/parent/enrollment/new" className="text-xs">Enroll</Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
            {selected?.studentName}
          </p>
        )}
        <Button asChild size="sm" variant="outline" className="shrink-0 h-8 gap-1.5 text-xs">
          <Link href="/parent/enrollment/new">
            <PlusCircle className="h-3.5 w-3.5" />
            New Enrollment
          </Link>
        </Button>
      </div>

      {/* Enrollment Status Banner */}
      {selected?.enrollment ? (
        <section className="overflow-hidden rounded-lg border border-red-200 bg-[#b4040d] text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
            <div className="min-w-0 space-y-0.5">
              <h3 className="truncate text-sm font-semibold">Current Enrollment Status</h3>
              <p className="text-xs text-red-100/90">
                {selected.enrollment.remark ?? "No remarks yet from the registrar."}
              </p>
            </div>
            <Badge className="shrink-0 border-0 bg-white/20 px-2 py-0.5 text-xs font-medium text-white" variant="neutral">
              {getStatusLabel(selected.enrollment.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-white/20 bg-black/10 px-4 py-3 md:grid-cols-4">
            {[
              { label: "Enrollment ID",  value: selected.enrollment.enrollmentNumber },
              { label: "Grade Level",    value: selected.enrollment.gradeLevel || "—" },
              { label: "Submitted",      value: selected.enrollment.submittedAt },
              { label: "Status",         value: getStatusLabel(selected.enrollment.status) },
            ].map((item) => (
              <div key={item.label} className="min-w-0 space-y-0.5">
                <p className="text-xs text-red-100/80">{item.label}</p>
                <p className="truncate text-xs font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">{selected?.studentName}</p>
            <p className="text-xs text-muted-foreground">No enrollment submitted yet</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
            <Link href="/parent/enrollment/new">
              <PlusCircle className="mr-1 h-3.5 w-3.5" />
              Enroll
            </Link>
          </Button>
        </div>
      )}

      {/* Required Documents */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Required Documents
          </CardTitle>
          <p className="text-xs text-muted-foreground">Upload missing documents below</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!selected?.enrollment ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Submit an enrollment to view required documents.
            </p>
          ) : selected.documents.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No documents required for this enrollment type.
            </p>
          ) : (
            <ParentDashboardDocuments
              enrollmentId={selected.enrollment.id}
              documents={selected.documents}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
