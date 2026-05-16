"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import Link from "next/link";
import { Search, Eye, Plus, Users, Loader2, RefreshCw, GraduationCap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormSelect } from "@/components/ui/form-select";

import { GRADE_LEVELS } from "@/lib/grade-levels";
const STATUS_OPTIONS = ["active","inactive","graduated","transferred"];

function statusVariant(status?: string): NonNullable<BadgeProps["variant"]> {
  if (status === "active") return "success";
  if (status === "graduated") return "warning";
  if (status === "transferred") return "pending";
  return "neutral";
}

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
            <Badge variant={statusVariant(student.status)}>{student.status || "unknown"}</Badge>
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
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || newStatus === student.status}
              className="ctk-danger-button"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, graduated: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [gradeBreakdown, setGradeBreakdown] = useState<{ grade: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (gradeFilter !== "__all__") params.set("gradeLevel", gradeFilter);
      if (statusFilter !== "__all__") params.set("status", statusFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.pagination?.total ?? data.students?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gradeFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const GRADE_LEVELS_ORDER = [
        "Kindergarten",
        "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
        "Grade 7","Grade 8","Grade 9","Grade 10",
      ];
      const [totalRes, activeRes, gradRes, allRes] = await Promise.all([
        fetch("/api/students?limit=1"),
        fetch("/api/students?status=active&limit=1"),
        fetch("/api/students?status=graduated&limit=1"),
        fetch("/api/students?limit=1000"),
      ]);
      const [td, ad, gd, allData] = await Promise.all([totalRes.json(), activeRes.json(), gradRes.json(), allRes.json()]);
      setSummary({
        total: td.pagination?.total ?? 0,
        active: ad.pagination?.total ?? 0,
        graduated: gd.pagination?.total ?? 0,
      });
      // Count students per grade from full list
      const countMap: Record<string, number> = {};
      for (const s of allData.students || []) {
        const g = s.currentGradeLevel;
        if (g) countMap[g] = (countMap[g] ?? 0) + 1;
      }
      setGradeBreakdown(
        GRADE_LEVELS_ORDER
          .map((grade) => ({ grade, count: countMap[grade] ?? 0 }))
          .filter((g) => g.count > 0)
      );
    } catch {}
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return (
    <div className="space-y-4 pb-8">
      {statusModal && (
        <StatusModal
          student={statusModal}
          onClose={() => setStatusModal(null)}
          onSuccess={() => { fetchStudents(); fetchSummary(); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student Records</h1>
          <p className="text-xs text-slate-500">Search, view, and manage student records</p>
        </div>
        <Button className="h-8 text-xs ctk-danger-button">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create New Record
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm w-full pl-8"
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
            />
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{summary.active}</p>
              <p className="text-xs text-emerald-700">Active Students</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{summary.graduated}</p>
              <p className="text-xs text-orange-700">Graduated</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-700">{summary.total}</p>
              <p className="text-xs text-slate-700">Total Records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students per Grade Level */}
      {gradeBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" /> Students per Grade Level
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...gradeBreakdown.map((g) => g.count));
                return gradeBreakdown.map(({ grade, count }) => (
                  <div key={grade} className="flex items-center gap-3 text-xs">
                    <span className="w-36 shrink-0 text-muted-foreground">{grade}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-semibold text-primary">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">All Student Records</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${total} record${total !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8" />
              No student records found.
            </div>
          ) : (
            <Table className="ctk-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-semibold text-primary">{student.studentId || "—"}</TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {student.personalInfo?.firstName || ""} {student.personalInfo?.lastName || ""}
                    </TableCell>
                    <TableCell className="text-slate-700">{student.currentGradeLevel || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(student.status)}>
                        {student.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {typeof student.parentUserId === "object" ? student.parentUserId?.email : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/students/${student._id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setStatusModal(student)}
                        >
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Status
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
