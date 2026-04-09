import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye } from "lucide-react";
import Link from "next/link";

async function getEnrollments() {
  await dbConnect();
  const enrollments = await Enrollment.find()
    .populate("studentId", "personalInfo")
    .populate("submittedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return enrollments;
}

export default async function EnrollmentsPage() {
  const session = await getServerSession(authOptions);
  const enrollments = await getEnrollments();

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
            Review and process enrollment applications
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Enrollments</CardTitle>
              <CardDescription>{enrollments.length} total applications</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search enrollments..."
                  className="pl-9 pr-4 py-2 border rounded-md text-sm w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No enrollments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grade Level</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment: any) => (
                    <tr key={enrollment._id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {enrollment.studentId?.personalInfo?.firstName} {enrollment.studentId?.personalInfo?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.enrollmentNumber || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{enrollment.gradeLevel}</td>
                      <td className="py-3 px-4 capitalize">{enrollment.enrollmentType}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(enrollment.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/registrar/enrollments/${enrollment._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
