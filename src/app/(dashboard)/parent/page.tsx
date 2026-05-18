import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import "@/models/Document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";
import AutoRefresh from "@/components/shared/auto-refresh";
import ParentChildPanel, { type ChildEnrollmentData } from "@/components/shared/parent-child-panel";

function formatDocumentTypeLabel(documentType: string) {
  return (
    ENROLLMENT_DOCUMENT_LABELS[documentType as keyof typeof ENROLLMENT_DOCUMENT_LABELS] ||
    documentType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review": return "Under Review";
    case "approved":     return "Approved";
    case "rejected":     return "Not Approved";
    case "enrolled":     return "Enrolled";
    case "pending":      return "Pending";
    default:             return status;
  }
}

function getStatusBadgeVariant(status: string): "warning" | "success" | "danger" | "info" | "neutral" {
  switch (status) {
    case "approved":
    case "enrolled":     return "success";
    case "rejected":     return "danger";
    case "under_review": return "info";
    default:             return "warning";
  }
}

const STATUS_DESCRIPTIONS = [
  { status: "Pending",      description: "Your enrollment application has been received and is waiting to be reviewed by the registrar." },
  { status: "Under Review", description: "The registrar is currently reviewing your application and submitted documents." },
  { status: "Approved",     description: "Your enrollment has been approved. Please wait for the registrar to finalize your enrollment." },
  { status: "Enrolled",     description: "Your child is officially enrolled for the school year." },
  { status: "Not Approved", description: "Your application was not approved. Please contact the registrar's office for details." },
];

async function getParentDashboardData(userId: string) {
  await dbConnect();

  const [students, enrollments] = await Promise.all([
    Student.find({ parentUserId: userId })
      .select("_id personalInfo currentGradeLevel")
      .lean(),
    Enrollment.find({ submittedBy: userId, isDraft: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate("studentId", "personalInfo")
      .populate("documents.documentId", "secureUrl cloudinaryUrl originalName fileName createdAt aiAnalysis")
      .lean(),
  ]);

  type RawStudent = { _id: unknown; personalInfo?: { firstName?: string; lastName?: string } };
  type RawEnrollment = typeof enrollments[number];

  const perStudentData: ChildEnrollmentData[] = (students as RawStudent[]).map((student) => {
    const studentEnrollments = enrollments.filter(
      (e) => String((e.studentId as { _id?: unknown } | null)?._id ?? e.studentId) === String(student._id)
    );
    const latest = studentEnrollments[0] as RawEnrollment | undefined;
    const studentName = `${student.personalInfo?.firstName ?? ""} ${student.personalInfo?.lastName ?? ""}`.trim() || "Unknown Child";

    const latestRemark = latest?.statusHistory?.length
      ? (latest.statusHistory[latest.statusHistory.length - 1] as { remarks?: string })?.remarks ?? null
      : null;

    const requiredDocs = latest?.enrollmentType
      ? getRequiredDocumentTypes(latest.enrollmentType as "new" | "returning" | "transferee")
      : [];
    const uploadedMap = new Map((latest?.documents ?? []).map((d) => [d.type, d]));

    const docRows = (latest?.documents ?? []).map((document) => {
      const dt = String(document.type);
      const docId = document.documentId as unknown as
        | { _id?: string; secureUrl?: string; originalName?: string; fileName?: string; createdAt?: string | Date; aiAnalysis?: { status: string; qualityFlags?: string[] } | null }
        | undefined;
      return {
        type: dt,
        label: formatDocumentTypeLabel(dt),
        status: (document.status ?? "pending") as "pending" | "verified" | "rejected" | "missing",
        uploadedAt: docId?.createdAt ?? null,
        downloadUrl: docId?._id ? `/api/documents/${docId._id}/view` : docId?.secureUrl ?? null,
        filename: docId?.originalName ?? docId?.fileName ?? null,
        aiAnalysis: docId?.aiAnalysis ?? null,
      };
    });

    const missingDocs = requiredDocs
      .filter((dt) => !uploadedMap.has(dt))
      .map((dt) => ({
        type: dt,
        label: formatDocumentTypeLabel(dt),
        status: "missing" as const,
        uploadedAt: null,
        downloadUrl: null,
        filename: null,
      }));

    const allDocs = docRows.length > 0 ? docRows : missingDocs;

    return {
      studentId: String(student._id),
      studentName,
      enrollment: latest
        ? {
            id: String(latest._id),
            enrollmentNumber: String(latest.enrollmentNumber ?? ""),
            gradeLevel: latest.gradeLevel ?? "—",
            status: latest.status,
            submittedAt: new Date(latest.submittedAt ?? latest.createdAt).toLocaleDateString("en-PH", {
              year: "numeric", month: "short", day: "numeric",
            }),
            remark: latestRemark ?? (latest.remarks as string | undefined) ?? null,
          }
        : null,
      documents: allDocs,
    };
  });

  return {
    perStudentData,
    allEnrollments: enrollments,
  };
}

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

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Child selector panel (status banner + required docs) */}
        <ParentChildPanel childData={data.perStudentData} />

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
                  <div
                    key={row.status}
                    className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 sm:flex-row sm:items-start sm:gap-3"
                  >
                    <Badge
                      variant={getStatusBadgeVariant(row.status.toLowerCase().replace(" ", "_"))}
                      className="w-fit shrink-0 text-xs"
                    >
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
                  {data.allEnrollments.map((enrollment) => {
                    const studentName = (() => {
                      const s = enrollment.studentId as { personalInfo?: { firstName?: string; lastName?: string } } | null;
                      if (!s?.personalInfo) return null;
                      return `${s.personalInfo.firstName ?? ""} ${s.personalInfo.lastName ?? ""}`.trim() || null;
                    })();
                    return (
                      <Link
                        key={String(enrollment._id)}
                        href={`/parent/enrollments/${enrollment._id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:bg-slate-100/70"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate font-mono text-xs font-semibold text-primary">
                            {String(enrollment.enrollmentNumber ?? "")}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {studentName ? `${studentName} · ` : ""}
                            {enrollment.gradeLevel ?? "—"} &middot;{" "}
                            {new Date(enrollment.createdAt).toLocaleDateString("en-PH", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(enrollment.status)} className="shrink-0 text-xs">
                          {getStatusLabel(enrollment.status)}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
