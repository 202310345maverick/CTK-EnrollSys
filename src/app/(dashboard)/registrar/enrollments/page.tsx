"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Eye, Loader2, Search, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormSelect } from "@/components/ui/form-select";

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

const getTypeVariant = (type: string): NonNullable<BadgeProps["variant"]> => {
  switch (type) {
    case "new": return "info";
    case "returning": return "success";
    case "transferee": return "default";
    default: return "neutral";
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [gradeFilter, setGradeFilter] = useState("__all__");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/enrollments?limit=200")
      .then((r) => r.json())
      .then((data) => setEnrollments(data.enrollments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) => {
    const name = `${e.studentId?.personalInfo?.firstName || ""} ${e.studentId?.personalInfo?.lastName || ""}`.toLowerCase();
    const num = (e.enrollmentNumber || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "__all__" || e.status === statusFilter;
    const matchesGrade = gradeFilter === "__all__" || e.gradeLevel === gradeFilter;
    const matchesType = typeFilter === "__all__" || e.enrollmentType === typeFilter;
    const matchesDateFrom = !dateFrom || new Date(e.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(e.createdAt) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesGrade && matchesType && matchesDateFrom && matchesDateTo;
  });

  const gradeLevels = Array.from(new Set(enrollments.map((e) => e.gradeLevel).filter(Boolean))).sort();

  const hasFilters = search || statusFilter !== "__all__" || gradeFilter !== "__all__" || typeFilter !== "__all__" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("__all__");
    setGradeFilter("__all__");
    setTypeFilter("__all__");
    setDateFrom("");
    setDateTo("");
  };

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
        <FormSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          placeholder="All Status"
          options={[
            { value: "__all__", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "under_review", label: "Under Review" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Not Approved" },
            { value: "enrolled", label: "Enrolled" },
          ]}
          className="w-36"
        />
        <FormSelect
          value={gradeFilter}
          onChange={(v) => setGradeFilter(v)}
          placeholder="All Grades"
          options={[{ value: "__all__", label: "All Grades" }, ...gradeLevels.map((g) => ({ value: g, label: g }))]}
          className="w-36"
        />
        <FormSelect
          value={typeFilter}
          onChange={(v) => setTypeFilter(v)}
          placeholder="All Types"
          options={[
            { value: "__all__", label: "All Types" },
            { value: "new", label: "New" },
            { value: "returning", label: "Returning" },
            { value: "transferee", label: "Transferee" },
          ]}
          className="w-36"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            title="Date from"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            title="Date to"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span>All Enrollments</span>
            <span className="text-xs font-normal text-muted-foreground">
              {loading ? "Loading..." : `Showing ${filtered.length} of ${enrollments.length}`}
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
            <div className="overflow-x-auto">
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
                    <TableCell>
                      {enrollment.enrollmentType ? (
                        <Badge variant={getTypeVariant(enrollment.enrollmentType)} className="text-xs capitalize">
                          {enrollment.enrollmentType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(enrollment.status)} className="text-xs">
                        {({"pending":"Pending","under_review":"Under Review","approved":"Approved","rejected":"Not Approved","enrolled":"Enrolled"} as Record<string,string>)[enrollment.status] ?? (enrollment.status as string).replace("_", " ")}
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
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
