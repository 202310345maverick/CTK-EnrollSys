"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Eye, Loader2, Users, RefreshCw, X } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";

import { GRADE_LEVELS } from "@/lib/grade-levels";
const STATUS_OPTIONS = ["active","inactive","graduated","transferred"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border border-slate-200",
  graduated: "bg-blue-100 text-blue-800 border border-blue-200",
  transferred: "bg-amber-100 text-amber-800 border border-amber-200",
};

type StatusModalProps = {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
};

function StatusModal({ student, onClose, onSuccess }: StatusModalProps) {
  const [newStatus, setNewStatus] = useState(student.status || "active");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Change Student Status</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {student.personalInfo?.firstName} {student.personalInfo?.lastName}
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Current Status</label>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[student.status] || "bg-slate-100 text-slate-600"}`}>
              {student.status || "unknown"}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">New Status</label>
            <FormSelect
              value={newStatus}
              onChange={setNewStatus}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "graduated", label: "Graduated" },
                { value: "transferred", label: "Transferred" },
              ]}
              placeholder="Select status"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || newStatus === student.status}
              className="ctk-danger-button"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusModal, setStatusModal] = useState<any>(null);

  const clearFilters = () => {
    setSearch("");
    setGradeFilter("__all__");
    setStatusFilter("__all__");
  };
  const hasActiveFilters = search !== "" || gradeFilter !== "__all__" || statusFilter !== "__all__";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (gradeFilter !== "__all__") params.set("gradeLevel", gradeFilter);
      if (statusFilter !== "__all__") params.set("status", statusFilter);
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.pagination?.total ?? data.students?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gradeFilter, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return (
    <div className="space-y-4">
      {statusModal && (
        <StatusModal
          student={statusModal}
          onClose={() => setStatusModal(null)}
          onSuccess={() => fetchStudents()}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Records</h1>
          <p className="text-xs text-slate-500">Search and view student records</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or LRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <FormSelect
              value={gradeFilter}
              onChange={(v) => setGradeFilter(v)}
              placeholder="All Grades"
              options={[
                { value: "__all__", label: "All Grades" },
                ...GRADE_LEVELS.map((g) => ({ value: g, label: g })),
              ]}
              className="w-36"
            />
            <FormSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder="All Status"
              options={[
                { value: "__all__", label: "All Status" },
                ...STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: s.charAt(0).toUpperCase() + s.slice(1),
                })),
              ]}
              className="w-36"
            />
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
                <X className="h-3 w-3" /> Clear Filters
              </Button>
            )}
            <CardTitle className="text-xs text-muted-foreground ml-auto">
              {total} student{total !== 1 ? "s" : ""}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">LRN</TableHead>
                  <TableHead className="text-xs">Grade Level</TableHead>
                  <TableHead className="text-xs">Section</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student._id} className="text-sm">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {student.personalInfo?.firstName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {student.personalInfo?.lastName}, {student.personalInfo?.firstName}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.studentId || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{student.lrn || "—"}</TableCell>
                    <TableCell className="text-xs">{student.currentGradeLevel || "—"}</TableCell>
                    <TableCell className="text-xs">{student.section || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[student.status] || "bg-slate-100 text-slate-600"}`}>
                        {student.status || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/registrar/students/${student._id}`}>
                          <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => setStatusModal(student)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Status
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
