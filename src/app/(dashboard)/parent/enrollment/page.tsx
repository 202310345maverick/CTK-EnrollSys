import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import Link from "next/link";

async function getEnrollments(userId: string) {
  await dbConnect();
  const enrollments = await Enrollment.find({ submittedBy: userId })
    .populate("studentId", "personalInfo")
    .sort({ createdAt: -1 })
    .lean();
  return enrollments;
}

export default async function ParentEnrollmentPage() {
  const session = await getServerSession(authOptions);
  const enrollments = await getEnrollments(session?.user?.id || "");

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "enrolled":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enrollments</h2>
          <p className="text-muted-foreground">
            View and manage enrollment applications
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Enrollment Applications</CardTitle>
          <CardDescription>{enrollments.length} total applications</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No enrollments yet</h3>
              <p className="text-muted-foreground">Start by enrolling a student</p>
              <Link href="/parent/enrollment/new">
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Enroll a Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      enrollment.status === "approved" ? "bg-green-100" :
                      enrollment.status === "rejected" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      {getStatusIcon(enrollment.status)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {enrollment.studentId?.personalInfo?.firstName} {enrollment.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.gradeLevel} • {enrollment.enrollmentType} Student
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status.replace("_", " ")}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(enrollment.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
