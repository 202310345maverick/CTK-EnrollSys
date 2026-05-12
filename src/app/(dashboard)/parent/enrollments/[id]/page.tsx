import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, CalendarClock, CheckCircle2, CircleAlert, FileText } from "lucide-react";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import "@/models/Document";    // ensure Document model is registered for populate
import "@/models/User";       // ensure User model is registered for statusHistory populate
import "@/models/Student";    // ensure Student model is registered for studentId populate
import "@/models/SchoolYear"; // ensure SchoolYear model is registered for schoolYearId populate
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  ENROLLMENT_DOCUMENT_TYPES,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";
import AutoRefresh from "@/components/shared/auto-refresh";

async function getParentEnrollmentDetail(enrollmentId: string, parentUserId: string) {
  await dbConnect();

  return Enrollment.findOne({
    _id: enrollmentId,
    submittedBy: parentUserId,
    isDraft: false,
  })
    .populate("studentId", "studentId personalInfo")
    .populate("schoolYearId", "name")
    .populate("statusHistory.changedBy", "profile.firstName profile.lastName email role")
    .populate("documents.documentId", "secureUrl cloudinaryUrl originalName fileName createdAt")
    .lean();
}

function getStatusVariant(status: string) {
  switch (status) {
    case "approved":
    case "enrolled":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "under_review":
      return "info" as const;
    default:
      return "warning" as const;
  }
}

function formatDateTime(value: Date | string | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChangedByLabel(changedBy: any) {
  if (!changedBy) {
    return "System";
  }

  const firstName = changedBy.profile?.firstName;
  const lastName = changedBy.profile?.lastName;
  if (firstName || lastName) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  return changedBy.email || "System";
}

export default async function ParentEnrollmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const enrollment = (await getParentEnrollmentDetail(params.id, userId)) as any;

  if (!enrollment) {
    return (
      <div className="space-y-4">
        <Link href="/parent/enrollments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Enrollments
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Enrollment record not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredDocs = getRequiredDocumentTypes(enrollment.enrollmentType);
  const uploadedDocsByType = new Map<
    string,
    { status?: "pending" | "verified" | "rejected"; remarks?: string; documentId?: { secureUrl?: string } }
  >(
    (enrollment.documents || []).map((document: any) => [String(document.type), document])
  );
  const timeline = [...(enrollment.statusHistory || [])].sort(
    (a: any, b: any) =>
      new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />
      <Link href="/parent/enrollments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Enrollments
        </Button>
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enrollment Details</h1>
          <p className="text-xs text-slate-500">{enrollment.enrollmentNumber}</p>
        </div>
        <Badge variant={getStatusVariant(enrollment.status)}>
          {{ pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Not Approved", enrolled: "Enrolled" }[String(enrollment.status)] ?? String(enrollment.status).replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {enrollment.studentId?.personalInfo?.firstName}{" "}
              {enrollment.studentId?.personalInfo?.lastName}
            </p>
            <p>
              <span className="text-muted-foreground">Student ID:</span>{" "}
              {enrollment.studentId?.studentId || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Grade Level:</span>{" "}
              {enrollment.gradeLevel || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Enrollment Type:</span>{" "}
              <span className="capitalize">{enrollment.enrollmentType || "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">School Year:</span>{" "}
              {enrollment.schoolYearId?.name || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Timeline and Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
            ) : (
              timeline.map((entry: any, index: number) => (
                <div key={`${entry.status}-${entry.changedAt}-${index}`} className="flex gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {{ pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Not Approved", enrolled: "Enrolled" }[String(entry.status)] ?? String(entry.status).replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.changedAt)} by {getChangedByLabel(entry.changedBy)}
                    </p>
                    {entry.remarks ? (
                      <p className="text-sm text-muted-foreground">{entry.remarks}</p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Document Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requiredDocs.map((documentType) => {
            const uploaded = uploadedDocsByType.get(documentType);
            const status = uploaded?.status || "missing";
            const statusLabel =
              status === "missing" ? "Missing" : String(status).replace("_", " ");
            const file = uploaded?.documentId as any;

            return (
              <div
                key={documentType}
                className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      status === "verified" || status === "pending"
                        ? "bg-emerald-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {status === "verified" || status === "pending" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleAlert className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{ENROLLMENT_DOCUMENT_LABELS[documentType]}</p>
                    {uploaded?.remarks ? (
                      <p className="text-xs text-muted-foreground">{uploaded.remarks}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status === "rejected" ? "danger" : status === "missing" ? "warning" : "success"}>
                    {statusLabel}
                  </Badge>
                  {file?.secureUrl || (file as any)?._id ? (
                    <a
                      href={(file as any)?._id ? `/api/documents/${(file as any)._id}/view` : file.secureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      View
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}

          {(enrollment.documents || [])
            .filter((document: any) => !requiredDocs.includes(document.type))
            .map((document: any, index: number) => (
              <div
                key={`extra-${document.type}-${index}`}
                className="flex items-center justify-between rounded-xl border border-dashed p-3"
              >
                <p className="text-sm text-muted-foreground capitalize">
                  Additional: {ENROLLMENT_DOCUMENT_LABELS[document.type as (typeof ENROLLMENT_DOCUMENT_TYPES)[number]] || document.type}
                </p>
                {(document.documentId as any)?._id || (document.documentId as any)?.secureUrl ? (
                  <a
                    href={(document.documentId as any)?._id ? `/api/documents/${(document.documentId as any)._id}/view` : (document.documentId as any).secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    View
                  </a>
                ) : null}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
