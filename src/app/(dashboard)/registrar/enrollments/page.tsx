import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Search, Filter, Eye } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const getStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
    switch (status) {
      case "pending": return "pending";
      case "under_review": return "info";
      case "approved": return "success";
      case "rejected": return "danger";
      case "enrolled": return "default";
      default: return "neutral";
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
      <PageHeader title="Enrollment Management" description="Review and manage student enrollment applications" />

      <Card className="ctk-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="ctk-section-title">All Enrollments</CardTitle>
              <CardDescription>{enrollments.length} total applications</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search enrollments..."
                  className="ctk-input w-64 pl-9"
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
            <Table className="ctk-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {enrollment.studentId?.personalInfo?.firstName} {enrollment.studentId?.personalInfo?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.enrollmentNumber || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.gradeLevel}</TableCell>
                      <TableCell className="capitalize">{enrollment.enrollmentType}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(enrollment.status)}>
                          {enrollment.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(enrollment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/registrar/enrollments/${enrollment._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
