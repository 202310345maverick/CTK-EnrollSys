import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  FileText,
  PlusCircle,
} from "lucide-react";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import "@/models/Document"; // ensure Document model is registered for populate
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";
import ParentDashboardDocuments from "@/components/shared/parent-dashboard-documents";

async function getParentDashboardData(userId: string) {
  await dbConnect();

  const [students, enrollments] = await Promise.all([
    Student.find({ parentUserId: userId })
      .select("_id personalInfo currentGradeLevel")
      .lean(),
    Enrollment.find({ submittedBy: userId, isDraft: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate("studentId", "personalInfo")
      .populate("documents.documentId", "secureUrl cloudinaryUrl originalName fileName createdAt")
      .lean(),
  ]);

  const latestEnrollment = enrollments[0] || null;

  return {
    studentsCount: students.length,
    latestEnrollment,
    allEnrollments: enrollments,
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review": return "Under Review";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "enrolled": return "Enrolled";
    case "pending": return "Pending";
    case "waitlisted": return "Waitlisted";
    default: return status;
  }
}

function getStatusBadgeVariant(status: string): "warning" | "success" | "danger" | "info" | "neutral" {
  switch (status) {
    case "approved":
    case "enrolled": return "success";
    case "rejected": return "danger";
    case "under_review": return "info";
    case "waitlisted": return "neutral";
    default: return "warning";
  }
}

function formatDocumentTypeLabel(documentType: string) {
  return (
    ENROLLMENT_DOCUMENT_LABELS[documentType as keyof typeof ENROLLMENT_DOCUMENT_LABELS] ||
    documentType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

const STATUS_DESCRIPTIONS = [
  { status: "Pending", description: "Your enrollment application has been received and is waiting to be reviewed by the registrar." },
  { status: "Under Review", description: "The registrar is currently reviewing your application and submitted documents." },
  { status: "Approved", description: "Your enrollment has been approved. Please proceed to the finance office for payment." },
  { status: "Enrolled", description: "Payment confirmed. Your child is officially enrolled for the school year." },
  { status: "Rejected", description: "Your application was not approved. Please contact the registrar's office for details." },
  { status: "Waitlisted", description: "Your application is on the waitlist. You will be notified if a slot becomes available." },
];

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await getParentDashboardData(userId);
  const currentEnrollment = data.latestEnrollment;

  const requiredDocs = currentEnrollment?.enrollmentType
    ? getRequiredDocumentTypes(currentEnrollment.enrollmentType as "new" | "returning" | "transferee")
    : [];

  const uploadedDocs = new Map(
    (currentEnrollment?.documents || []).map((document) => [document.type, document])
  );

  const latestStudent = currentEnrollment?.studentId as
    | { personalInfo?: { firstName?: string; lastName?: string } }
    | undefined;

  const documentRows = requiredDocs.map((documentType) => {
    const uploadedDocument = uploadedDocs.get(documentType);
    return {
      type: documentType,
      label: formatDocumentTypeLabel(documentType),
      status: (uploadedDocument?.status || "missing") as "pending" | "verified" | "rejected" | "missing",
      uploadedAt:
        uploadedDocument?.documentId && typeof uploadedDocument.documentId === "object"
          ? (uploadedDocument.documentId as { createdAt?: string | Date }).createdAt || null
          : null,
      downloadUrl:
        uploadedDocument?.documentId && typeof uploadedDocument.documentId === "object"
          ? (uploadedDocument.documentId as unknown as { _id?: string; secureUrl?: string })._id
            ? `/api/documents/${(uploadedDocument.documentId as unknown as { _id: string })._id}/view`
            : (uploadedDocument.documentId as unknown as { secureUrl?: string }).secureUrl || null
          : null,
    };
  });

  const submittedDocumentRows = (currentEnrollment?.documents || []).map((document) => {
    const documentType = String(document.type);
    const documentId = document.documentId as unknown as
      | { _id?: string; secureUrl?: string; originalName?: string; fileName?: string; createdAt?: string | Date }
      | undefined;
    return {
      type: documentType,
      label: formatDocumentTypeLabel(documentType),
      status: (document.status || "pending") as "pending" | "verified" | "rejected" | "missing",
      uploadedAt: documentId?.createdAt || null,
      downloadUrl: documentId?._id
        ? `/api/documents/${documentId._id}/view`
        : documentId?.secureUrl || null,
      filename: documentId?.originalName || documentId?.fileName || null,
    };
  });

  const latestStatusRemark = currentEnrollment?.statusHistory?.length
    ? currentEnrollment.statusHistory[currentEnrollment.statusHistory.length - 1]?.remarks
    : null;

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Parent Dashboard</h1>
        <p className="text-xs text-slate-500">Track your child&apos;s enrollment journey and important updates.</p>
      </div>

      {/* Current Enrollment Banner */}
      {currentEnrollment ? (
        <section className="overflow-hidden rounded-lg border border-red-200 bg-[#b4040d] text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold">Current Enrollment Status</h2>
              <p className="text-xs text-red-100/90">
                {latestStatusRemark || currentEnrollment.remarks || "No remarks yet from the registrar."}
              </p>
            </div>
            <Badge className="border-0 bg-white/20 px-2 py-0.5 text-xs font-medium text-white" variant="neutral">
              {getStatusLabel(currentEnrollment.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-white/20 bg-black/10 px-4 py-3 md:grid-cols-4">
            {[
              { label: "Enrollment ID", value: currentEnrollment.enrollmentNumber },
              {
                label: "Student Name",
                value: `${latestStudent?.personalInfo?.firstName || ""} ${latestStudent?.personalInfo?.lastName || ""}`.trim() || "—",
              },
              { label: "Grade Level", value: currentEnrollment.gradeLevel || "—" },
              {
                label: "Submitted",
                value: new Date(currentEnrollment.submittedAt || currentEnrollment.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric", month: "short", day: "numeric",
                }),
              },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <p className="text-xs text-red-100/80">{item.label}</p>
                <p className="text-xs font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Card className="border border-dashed">
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
      )}

      {/* Main Grid */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Required Documents */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Required Documents
            </CardTitle>
            <p className="text-xs text-muted-foreground">Upload missing documents below</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {requiredDocs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Submit an enrollment to view required documents.
              </p>
            ) : (
              <ParentDashboardDocuments
                enrollmentId={String(currentEnrollment?._id || "")}
                documents={submittedDocumentRows.length > 0 ? submittedDocumentRows : documentRows}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Enrollment Status Description */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Enrollment Status Description</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="pb-1.5 text-left font-semibold text-slate-700 w-28">Status</th>
                    <th className="pb-1.5 text-left font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {STATUS_DESCRIPTIONS.map((row) => (
                    <tr key={row.status}>
                      <td className="py-1.5 pr-3 align-top">
                        <Badge variant={getStatusBadgeVariant(row.status.toLowerCase().replace(" ", "_"))} className="text-xs">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-slate-600 align-top">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Enrollment History */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Enrollment History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {data.allEnrollments.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No enrollment history yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-1.5 text-left font-semibold text-slate-700">ID</th>
                      <th className="pb-1.5 text-left font-semibold text-slate-700">Grade</th>
                      <th className="pb-1.5 text-left font-semibold text-slate-700">Date</th>
                      <th className="pb-1.5 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.allEnrollments.map((enrollment) => (
                      <tr key={String(enrollment._id)}>
                        <td className="py-1.5 pr-2 font-mono text-slate-700">
                          <Link href={`/parent/enrollments/${enrollment._id}`} className="hover:underline text-primary">
                            {enrollment.enrollmentNumber}
                          </Link>
                        </td>
                        <td className="py-1.5 pr-2 text-slate-600">{enrollment.gradeLevel || "—"}</td>
                        <td className="py-1.5 pr-2 text-slate-500">
                          {new Date(enrollment.createdAt).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="py-1.5">
                          <Badge variant={getStatusBadgeVariant(enrollment.status)} className="text-xs">
                            {getStatusLabel(enrollment.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
