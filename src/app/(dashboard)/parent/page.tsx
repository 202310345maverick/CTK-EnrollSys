import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  Mail,
  Phone,
  PlusCircle,
} from "lucide-react";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import Payment from "@/models/Payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsGrid } from "@/components/shared/stats-grid";
import { formatCurrency } from "@/lib/utils";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";

async function getParentDashboardData(userId: string) {
  await dbConnect();

  const [students, enrollments] = await Promise.all([
    Student.find({ parentUserId: userId })
      .select("_id personalInfo currentGradeLevel")
      .lean(),
    Enrollment.find({ submittedBy: userId }).sort({ updatedAt: -1 }).lean(),
  ]);

  const studentIds = students.map((student) => student._id);
  const payments =
    studentIds.length > 0
      ? await Payment.find({
          studentId: { $in: studentIds },
          isVoided: false,
        })
          .select("amount paymentDate")
          .lean()
      : [];

  const nonDraftEnrollments = enrollments.filter((enrollment) => !enrollment.isDraft);
  const drafts = enrollments.filter((enrollment) => enrollment.isDraft);
  const latestEnrollment = nonDraftEnrollments[0] || null;
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    studentsCount: students.length,
    draftsCount: drafts.length,
    pendingCount: nonDraftEnrollments.filter((enrollment) =>
      ["pending", "under_review"].includes(enrollment.status)
    ).length,
    approvedCount: nonDraftEnrollments.filter((enrollment) =>
      ["approved", "enrolled"].includes(enrollment.status)
    ).length,
    rejectedCount: nonDraftEnrollments.filter((enrollment) => enrollment.status === "rejected")
      .length,
    totalPaid,
    latestEnrollment,
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "enrolled":
      return "Enrolled";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

function getStatusBadgeVariant(status: string): "warning" | "success" | "danger" | "info" {
  switch (status) {
    case "approved":
    case "enrolled":
      return "success";
    case "rejected":
      return "danger";
    case "under_review":
      return "info";
    default:
      return "warning";
  }
}

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const data = await getParentDashboardData(userId);
  const currentEnrollment = data.latestEnrollment;
  const requiredDocs = currentEnrollment?.enrollmentType
    ? getRequiredDocumentTypes(currentEnrollment.enrollmentType as "new" | "returning" | "transferee")
    : [];
  const uploadedDocs = new Map(
    (currentEnrollment?.documents || []).map((document) => [document.type, document])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ctk-page-title">Parent Dashboard</h1>
          <p className="ctk-page-subtitle">
            Track enrollment progress, required documents, and payment updates.
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button className="ctk-danger-button">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
        </Link>
      </div>

      <StatsGrid
        items={[
          {
            title: "Children",
            value: data.studentsCount,
            icon: FileText,
          },
          {
            title: "Active Applications",
            value: data.pendingCount,
            icon: Clock3,
            iconBgClassName: "bg-amber-100",
            iconClassName: "text-amber-700",
          },
          {
            title: "Drafts",
            value: data.draftsCount,
            icon: FileText,
            iconBgClassName: "bg-slate-100",
            iconClassName: "text-slate-700",
          },
          {
            title: "Total Paid",
            value: formatCurrency(data.totalPaid),
            icon: CreditCard,
            iconBgClassName: "bg-emerald-100",
            iconClassName: "text-emerald-700",
          },
        ]}
      />

      {currentEnrollment ? (
        <section className="rounded-xl border border-amber-400 bg-[#b2000f] px-6 py-5 text-white shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-3xl font-extrabold leading-none tracking-tight">
              Current Enrollment Status
            </h2>
            <Badge className="border-0" variant={getStatusBadgeVariant(currentEnrollment.status)}>
              {getStatusLabel(currentEnrollment.status)}
            </Badge>
          </div>

          <div className="grid gap-4 border-b border-amber-500/80 pb-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-amber-100">Enrollment ID</p>
              <p className="text-xl font-bold leading-none">{currentEnrollment.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">Grade Level</p>
              <p className="text-xl font-bold leading-none">{currentEnrollment.gradeLevel || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">Type</p>
              <p className="text-xl font-bold leading-none capitalize">
                {currentEnrollment.enrollmentType || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">Submitted Date</p>
              <p className="text-xl font-bold leading-none">
                {currentEnrollment.submittedAt
                  ? new Date(currentEnrollment.submittedAt).toLocaleDateString("en-PH")
                  : new Date(currentEnrollment.createdAt).toLocaleDateString("en-PH")}
              </p>
            </div>
          </div>

          <p className="pt-4 text-sm text-amber-50">
            Latest status update:{" "}
            {currentEnrollment.statusHistory?.[0]?.remarks || "No remarks yet."}
          </p>
        </section>
      ) : (
        <Card className="ctk-panel">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">No submitted enrollments yet</h3>
            <p className="text-sm text-muted-foreground">
              Start your first enrollment application to track status updates here.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="ctk-panel">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="ctk-section-title">Document Checklist</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Submit an enrollment to view document status.
              </p>
            ) : (
              requiredDocs.map((documentType) => {
                const uploadedDocument = uploadedDocs.get(documentType);
                const status = uploadedDocument?.status || "missing";
                const isComplete = status === "verified" || status === "pending";

                return (
                  <div
                    key={documentType}
                    className="flex items-center justify-between rounded-xl border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          isComplete ? "bg-emerald-100" : "bg-amber-100"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CircleAlert className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{ENROLLMENT_DOCUMENT_LABELS[documentType]}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {status === "missing" ? "Not uploaded yet" : status.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isComplete ? "success" : "warning"}>
                      {isComplete ? "Uploaded" : "Pending"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">Enrollment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Approved / Enrolled</span>
                <span className="font-semibold text-emerald-700">{data.approvedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending / Under Review</span>
                <span className="font-semibold text-amber-700">{data.pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejected</span>
                <span className="font-semibold text-red-700">{data.rejectedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Draft Applications</span>
                <span className="font-semibold text-slate-700">{data.draftsCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="ctk-panel border-amber-300 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold text-primary leading-none">
                Need Help?
              </CardTitle>
              <p className="text-sm text-primary/90">
                Contact the registrar&apos;s office for enrollment concerns.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-primary/90">
                <Phone className="h-4 w-4" />
                Phone: (+63) 921-816-2137
              </p>
              <p className="flex items-center gap-2 text-primary/90">
                <Mail className="h-4 w-4" />
                Email: registrar@ctk.edu
              </p>
              <p className="flex items-center gap-2 text-primary/90">
                <Clock3 className="h-4 w-4" />
                Hours: Mon-Fri, 8AM-5PM
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
