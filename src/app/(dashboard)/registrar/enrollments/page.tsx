"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Eye, Loader2, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const getStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
  switch (status) {
    case "pending": return "pending";
    case "under_review": return "info";
    case "approved": return "success";
    case "rejected": return "danger";
    case "enrolled": return "default";
    default: return "neutral";
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  useEffect(() => {
    fetch("/api/enrollments")
      .then((r) => r.json())
      .then((data) => setEnrollments(data.enrollments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) => {
    const name = `${e.studentId?.personalInfo?.firstName || ""} ${e.studentId?.personalInfo?.lastName || ""}`.toLowerCase();
    const num = (e.enrollmentNumber || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesGrade = gradeFilter === "all" || e.gradeLevel === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  const gradeLevels = Array.from(new Set(enrollments.map((e) => e.gradeLevel).filter(Boolean))).sort();

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Enrollment Management</h1>
        <p className="text-xs text-slate-500">Review and manage student enrollment applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or enrollment #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="enrolled">Enrolled</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="all">All Grades</option>
          {gradeLevels.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span>All Enrollments</span>
            <span className="text-xs font-normal text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} of ${enrollments.length}`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No enrollments found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Grade</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Submitted</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((enrollment: any) => (
                  <TableRow key={enrollment._id} className="text-xs">
                    <TableCell>
                      <p className="text-sm font-medium">
                        {enrollment.studentId?.personalInfo?.firstName}{" "}
                        {enrollment.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{enrollment.enrollmentNumber}</p>
                    </TableCell>
                    <TableCell className="text-xs">{enrollment.gradeLevel || "—"}</TableCell>
                    <TableCell className="capitalize text-xs">{enrollment.enrollmentType || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(enrollment.status)} className="text-xs capitalize">
                        {enrollment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(enrollment.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/registrar/enrollments/${enrollment._id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Review
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
