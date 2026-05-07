"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Search, Eye, Plus, Users, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormSelect } from "@/components/ui/form-select";

const GRADE_LEVELS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const STATUS_OPTIONS = ["active","inactive","graduated","transferred"];

function statusVariant(status?: string): NonNullable<BadgeProps["variant"]> {
  if (status === "active") return "success";
  if (status === "graduated") return "warning";
  if (status === "transferred") return "pending";
  return "neutral";
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, graduated: 0 });
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (gradeFilter) params.set("gradeLevel", gradeFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || data || []);
      setTotal(data.total || (data.students || data || []).length);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const [totalRes, activeRes, gradRes] = await Promise.all([
        fetch("/api/students?limit=0"),
        fetch("/api/students?status=active&limit=0"),
        fetch("/api/students?status=graduated&limit=0"),
      ]);
      const [td, ad, gd] = await Promise.all([totalRes.json(), activeRes.json(), gradRes.json()]);
      setSummary({
        total: td.total ?? 0,
        active: ad.total ?? 0,
        graduated: gd.total ?? 0,
      });
    } catch {}
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Records Management"
        description="Search, view, and manage student records"
        actions={
          <Button className="h-11 rounded-xl px-5 ctk-danger-button">
            <Plus className="mr-2 h-4 w-4" />
            Create New Record
          </Button>
        }
      />

      <Card className="ctk-panel">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ctk-input w-full border pl-10"
              />
            </div>
            <FormSelect
              value={gradeFilter}
              onChange={(v) => setGradeFilter(v)}
              placeholder="All Grades"
              options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
            />
            <FormSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder="All Status"
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-emerald-700">{summary.active}</p>
              <p className="text-sm text-emerald-700">Active Students</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-orange-700">{summary.graduated}</p>
              <p className="text-sm text-orange-700">Graduated</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-slate-700">{summary.total}</p>
              <p className="text-sm text-slate-700">Total Records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="ctk-panel">
        <CardHeader>
          <CardTitle className="ctk-section-title">All Student Records</CardTitle>
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
                      <Button variant="outline" size="sm" className="h-8">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
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
