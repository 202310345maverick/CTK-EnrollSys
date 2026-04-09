import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Clock, User, FileText, Calendar } from "lucide-react";
import Link from "next/link";

async function getEnrollment(enrollmentId: string) {
  await dbConnect();
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("studentId")
    .populate("submittedBy", "name email")
    .populate("reviewedBy", "name")
    .lean();
  return enrollment;
}

export default async function EnrollmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const enrollment = await getEnrollment(params.id) as any;

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/registrar/enrollments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Enrollment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "enrolled": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canReview = enrollment.status === "pending" || enrollment.status === "under_review";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/registrar/enrollments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Enrollments
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Enrollment Application
          </h2>
          <p className="text-muted-foreground">
            {enrollment.enrollmentNumber || "No enrollment number yet"}
          </p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full capitalize ${getStatusColor(enrollment.status)}`}>
          {enrollment.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {enrollment.studentId?.personalInfo?.firstName} {enrollment.studentId?.personalInfo?.middleName} {enrollment.studentId?.personalInfo?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{enrollment.studentId?.personalInfo?.gender || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(enrollment.studentId?.personalInfo?.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LRN</p>
                <p className="font-medium font-mono">{enrollment.studentId?.lrn || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Enrollment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Grade Level</p>
                <p className="font-medium">{enrollment.gradeLevel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Type</p>
                <p className="font-medium capitalize">{enrollment.enrollmentType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">School Year</p>
                <p className="font-medium">{enrollment.schoolYear || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section Preference</p>
                <p className="font-medium">{enrollment.sectionPreference || "No preference"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Submitted</p>
                <p className="text-sm text-muted-foreground">{formatDate(enrollment.createdAt)}</p>
                <p className="text-sm text-muted-foreground">By: {enrollment.submittedBy?.name || enrollment.submittedBy?.email}</p>
              </div>
            </div>
            {enrollment.reviewedAt && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${enrollment.status === "approved" ? "bg-green-100" : "bg-red-100"}`}>
                  {enrollment.status === "approved" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{enrollment.status === "approved" ? "Approved" : "Reviewed"}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(enrollment.reviewedAt)}</p>
                  {enrollment.reviewedBy && (
                    <p className="text-sm text-muted-foreground">By: {enrollment.reviewedBy?.name}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {canReview && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Review this enrollment application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment.status === "pending" && (
                <Button variant="outline" className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Mark Under Review
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Add notes about this application..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remarks */}
        {enrollment.remarks && (
          <Card>
            <CardHeader>
              <CardTitle>Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{enrollment.remarks}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
