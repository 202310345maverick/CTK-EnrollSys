"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Eye, Loader2, Users } from "lucide-react";

const GRADE_LEVELS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const STATUS_OPTIONS = ["active","inactive","graduated","transferred"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border border-slate-200",
  graduated: "bg-blue-100 text-blue-800 border border-blue-200",
  transferred: "bg-amber-100 text-amber-800 border border-amber-200",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (gradeFilter) params.set("gradeLevel", gradeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gradeFilter, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Student Records"
        description="Search and view student records"
      />

      <Card className="ctk-panel">
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
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All Grades</option>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
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
                      <Link href={`/registrar/students/${student._id}`}>
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
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
