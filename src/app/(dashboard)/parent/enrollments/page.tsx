"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  PlusCircle, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { FormSelect } from "@/components/ui/form-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Enrollment {
  _id: string;
  enrollmentNumber: string;
  gradeLevel?: string;
  enrollmentType?: string;
  status: string;
  isDraft?: boolean;
  updatedAt?: string;
  createdAt: string;
  studentId?: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  draft: {
    icon: <FileText className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    label: "Draft",
  },
  pending: { 
    icon: <Clock className="h-4 w-4" />, 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    label: "Pending Review" 
  },
  under_review: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: "bg-blue-100 text-blue-800 border-blue-200", 
    label: "Under Review" 
  },
  approved: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: "bg-green-100 text-green-800 border-green-200", 
    label: "Approved" 
  },
  enrolled: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: "bg-green-100 text-green-800 border-green-200", 
    label: "Enrolled" 
  },
  rejected: { 
    icon: <XCircle className="h-4 w-4" />, 
    color: "bg-red-100 text-red-800 border-red-200", 
    label: "Not Approved" 
  },
};

export default function ParentEnrollmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/enrollments?includeDrafts=1&limit=100");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/enrollments/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast({
        title: "Enrollment Deleted",
        description: "The enrollment application has been deleted successfully.",
      });

      // Remove from list
      setEnrollments(prev => prev.filter(e => e._id !== deleteId));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete enrollment",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch = enrollment.enrollmentNumber
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      (enrollment.studentId?.personalInfo?.firstName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (enrollment.studentId?.personalInfo?.lastName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Enrollment Applications</h1>
          <p className="text-xs text-slate-500">
            {filteredEnrollments.length} {filteredEnrollments.length === 1 ? "application" : "applications"}
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button size="sm" className="bg-[#b4040d] hover:bg-[#b4040d]/90">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            New Enrollment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by enrollment number or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <FormSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          placeholder="All Status"
          options={[
            { value: "draft", label: "Draft" },
            { value: "pending", label: "Pending" },
            { value: "under_review", label: "Under Review" },
            { value: "approved", label: "Approved" },
            { value: "enrolled", label: "Enrolled" },
            { value: "rejected", label: "Not Approved" },
          ]}
          className="w-40"
        />
      </div>

      {filteredEnrollments.length === 0 && enrollments.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">No Enrollment Applications</p>
            <p className="mt-1 text-xs text-muted-foreground">Start your first enrollment to begin the process.</p>
            <Link href="/parent/enrollment/new">
              <Button size="sm" className="mt-3 bg-[#b4040d] hover:bg-[#b4040d]/90">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Start New Enrollment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredEnrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No matching enrollments</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredEnrollments.map((enrollment) => {
            const status = statusConfig[enrollment.status] || statusConfig.pending;
            const canDelete = enrollment.status === "pending" || enrollment.status === "draft";
            const isDraft = enrollment.status === "draft" || enrollment.isDraft;
            const studentName = enrollment.studentId?.personalInfo
              ? `${enrollment.studentId.personalInfo.firstName} ${enrollment.studentId.personalInfo.lastName}`
              : "Draft application";
            const displayDate = formatDate(
              isDraft && enrollment.updatedAt ? enrollment.updatedAt : enrollment.createdAt
            );

            return (
              <Card key={enrollment._id} className="ctk-card-interactive group">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                          {studentName}
                        </h3>
                        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono font-medium text-slate-700">{enrollment.enrollmentNumber}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {enrollment.enrollmentType ? `${enrollment.enrollmentType} Student` : "Incomplete"}
                        </span>
                        {enrollment.gradeLevel && (
                          <>
                            <span>•</span>
                            <span>{enrollment.gradeLevel}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{isDraft ? "Saved" : "Submitted"}: {displayDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => router.push(`/parent/enrollment/new?draft=${enrollment._id}`)}
                        >
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Continue Draft
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => router.push(`/parent/enrollments/${enrollment._id}`)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(enrollment._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Enrollment Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the enrollment
              application and all associated data including uploaded documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
