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
import AutoRefresh from "@/components/shared/auto-refresh";

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

  // Group enrollments by student
  const perStudentData = (students as Array<{ _id: unknown; personalInfo?: { firstName?: string; lastName?: string }; currentGradeLevel?: string }>).map((student) => {
    const studentEnrollments = enrollments.filter(
      (e) => String((e.studentId as { _id?: unknown } | null)?._id ?? e.studentId) === String(student._id)
    );
    return {
      student,
      latestEnrollment: studentEnrollments[0] ?? null,
      enrollments: studentEnrollments,
    };
  });

  // Enrollments not matched to a known student (edge case)
  const unmatchedEnrollments = enrollments.filter(
    (e) => !(students as Array<{ _id: unknown }>).some(
      (s) => String(s._id) === String((e.studentId as { _id?: unknown } | null)?._id ?? e.studentId)
    )
  );

  return {
    studentsCount: students.length,
    latestEnrollment,
    allEnrollments: enrollments,
    perStudentData,
    unmatchedEnrollments,
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review": return "Under Review";
    case "approved": return "Approved";
    case "rejected": return "Not Approved";
    case "enrolled": return "Enrolled";
    case "pending": return "Pending";
    default: return status;
  }
}

function getStatusBadgeVariant(status: string): "warning" | "success" | "danger" | "info" | "neutral" {
  switch (status) {
    case "approved":
    case "enrolled": return "success";
    case "rejected": return "danger";
    case "under_review": return "info";
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
  { status: "Approved", description: "Your enrollment has been approved. Please wait for the registrar to finalize your enrollment." },
  { status: "Enrolled", description: "Your child is officially enrolled for the school year." },
  { status: "Not Approved", description: "Your application was not approved. Please contact the registrar's office for details." },
];

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await getParentDashboardData(userId);

  return (
    <div className="min-w-0 space-y-4 pb-8">
      <AutoRefresh intervalMs={30000} />
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Parent Dashboard</h1>
        <p className="text-xs text-slate-500">Track your child&apos;s enrollment journey and important updates.</p>
      </div>

      {/* Children Enrollment Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Children Enrollment Status</h2>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
            <Link href="/parent/enrollment/new">
              <PlusCircle className="h-3.5 w-3.5" />
              New Enrollment
            </Link>
          </Button>
        </div>

        {data.perStudentData.length === 0 && data.unmatchedEnrollments.length === 0 ? (
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
        ) : (
          <>
            {data.perStudentData.map(({ student, latestEnrollment: childEnrollment }) => {
              if (!childEnrollment) return null;
              const childName = `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim() || "Unknown Child";
              const latestRemark = childEnrollment.statusHistory?.length
                ? childEnrollment.statusHistory[childEnrollment.statusHistory.length - 1]?.remarks
                : null;
              return (
                <section key={String(student._id)} className="overflow-hidden rounded-lg border border-red-200 bg-[#b4040d] text-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="truncate text-sm font-semibold">{childName}</h3>
                      <p className="text-xs text-red-100/90">
                        {latestRemark ?? childEnrollment.remarks ?? "No remarks yet from the registrar."}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-0 bg-white/20 px-2 py-0.5 text-xs font-medium text-white" variant="neutral">
                      {getStatusLabel(childEnrollment.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-white/20 bg-black/10 px-4 py-3 md:grid-cols-4">
                    {[
                      { label: "Enrollment ID", value: childEnrollment.enrollmentNumber },
                      { label: "Grade Level", value: childEnrollment.gradeLevel ?? "—" },
                      {
                        label: "Submitted",
                        value: new Date(childEnrollment.submittedAt ?? childEnrollment.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric",
                        }),
                      },
                      { label: "Status", value: getStatusLabel(childEnrollment.status) },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0 space-y-0.5">
                        <p className="text-xs text-red-100/80">{item.label}</p>
                        <p className="truncate text-xs font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            {/* Students with no enrollment */}
            {data.perStudentData.filter(({ latestEnrollment: e }) => !e).map(({ student }) => {
              const childName = `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim() || "Unknown Child";
              return (
                <div key={String(student._id)} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{childName}</p>
                    <p className="text-xs text-muted-foreground">No enrollment submitted yet</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
                    <Link href="/parent/enrollment/new">
                      <PlusCircle className="mr-1 h-3.5 w-3.5" />
                      Enroll
                    </Link>
                  </Button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Required Documents — one section per child with an enrollment */}
        <div className="min-w-0 space-y-4">
          {data.perStudentData.filter(({ latestEnrollment: e }) => !!e).map(({ student, latestEnrollment: childEnrollment }) => {
            if (!childEnrollment) return null;
            const childName = `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim() || "Unknown Child";
            const childRequiredDocs = childEnrollment.enrollmentType
              ? getRequiredDocumentTypes(childEnrollment.enrollmentType as "new" | "returning" | "transferee")
              : [];
            const childUploadedDocs = new Map(
              (childEnrollment.documents ?? []).map((d) => [d.type, d])
            );
            const childDocRows = (childEnrollment.documents ?? []).map((document) => {
              const documentType = String(document.type);
              const documentId = document.documentId as unknown as
                | { _id?: string; secureUrl?: string; originalName?: string; fileName?: string; createdAt?: string | Date }
                | undefined;
              return {
                type: documentType,
                label: formatDocumentTypeLabel(documentType),
                status: (document.status ?? "pending") as "pending" | "verified" | "rejected" | "missing",
                uploadedAt: documentId?.createdAt ?? null,
                downloadUrl: documentId?._id
                  ? `/api/documents/${documentId._id}/view`
                  : documentId?.secureUrl ?? null,
                filename: documentId?.originalName ?? documentId?.fileName ?? null,
              };
            });
            const childMissingDocs = childRequiredDocs
              .filter((dt) => !childUploadedDocs.has(dt))
              .map((dt) => ({
                type: dt,
                label: formatDocumentTypeLabel(dt),
                status: "missing" as const,
                uploadedAt: null,
                downloadUrl: null,
                filename: null,
              }));
            const allChildDocs = childDocRows.length > 0 ? childDocRows : [...childMissingDocs];

            return (
              <Card key={String(student._id)} className="min-w-0 overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-primary" />
                    {childName} — Documents
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Upload missing documents below</p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {allChildDocs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No documents required for this enrollment type.
                    </p>
                  ) : (
                    <ParentDashboardDocuments
                      enrollmentId={String(childEnrollment._id)}
                      documents={allChildDocs}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data.perStudentData.every(({ latestEnrollment: e }) => !e) && (
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Submit an enrollment to view required documents.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="min-w-0 space-y-4">
          {/* Enrollment Status Description */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Enrollment Status Description</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {STATUS_DESCRIPTIONS.map((row) => (
                  <div key={row.status} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
                    <Badge variant={getStatusBadgeVariant(row.status.toLowerCase().replace(" ", "_"))} className="w-fit shrink-0 text-xs">
                      {row.status}
                    </Badge>
                    <p className="text-xs text-slate-600">{row.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enrollment History */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Enrollment History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {data.allEnrollments.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No enrollment history yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.allEnrollments.map((enrollment) => (
                    <Link
                      key={String(enrollment._id)}
                      href={`/parent/enrollments/${enrollment._id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-mono text-xs font-semibold text-primary">
                          {enrollment.enrollmentNumber}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {enrollment.gradeLevel || "—"} &middot;{" "}
                          {new Date(enrollment.createdAt).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(enrollment.status)} className="shrink-0 text-xs">
                        {getStatusLabel(enrollment.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
