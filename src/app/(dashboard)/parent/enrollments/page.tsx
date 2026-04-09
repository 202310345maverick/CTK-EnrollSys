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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
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
  gradeLevel: string;
  enrollmentType: string;
  status: string;
  createdAt: string;
  studentId: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
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
    label: "Rejected" 
  },
  waitlisted: { 
    icon: <Clock className="h-4 w-4" />, 
    color: "bg-orange-100 text-orange-800 border-orange-200", 
    label: "Waitlisted" 
  },
};

export default function ParentEnrollmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/enrollments");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Enrollment Applications</h2>
          <p className="text-muted-foreground">
            View and manage your enrollment applications
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button className="bg-maroon hover:bg-maroon-dark">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Enrollment Applications</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t submitted any enrollment applications yet.
            </p>
            <Link href="/parent/enrollment/new">
              <Button className="bg-maroon hover:bg-maroon-dark">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start Enrollment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => {
            const status = statusConfig[enrollment.status] || statusConfig.pending;
            const canDelete = enrollment.status === "pending";

            return (
              <Card key={enrollment._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {enrollment.studentId?.personalInfo?.firstName}{" "}
                          {enrollment.studentId?.personalInfo?.lastName}
                        </h3>
                        <span className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{enrollment.enrollmentNumber}</span>
                        <span>•</span>
                        <span className="capitalize">{enrollment.enrollmentType} Student</span>
                        <span>•</span>
                        <span>{enrollment.gradeLevel}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {formatDate(enrollment.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/parent/enrollments/${enrollment._id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(enrollment._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
