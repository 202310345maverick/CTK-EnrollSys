import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Search, Filter, Eye, UserPlus } from "lucide-react";
import Link from "next/link";
import ExportDemo from "@/components/ExportDemo";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getStudents() {
  await dbConnect();
  const students = await Student.find()
    .sort({ createdAt: -1 })
    .lean();
  return students;
}

export default async function StudentsPage() {
  await getServerSession(authOptions);
  const students = await getStudents();

  const getStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
    switch (status) {
      case "active": return "success";
      case "inactive": return "neutral";
      case "graduated": return "warning";
      case "transferred": return "pending";
      default: return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Records Management"
        description="Search, view, and manage student records"
        actions={
        <div className="flex items-center gap-2">
          <Button className="ctk-danger-button">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <ExportDemo reportKey="Student Records" />
        </div>
        }
      />

      <Card className="ctk-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="ctk-section-title">All Students</CardTitle>
              <CardDescription>{students.length} total students</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search students..."
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
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No students found</p>
          ) : (
            <Table className="ctk-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student</TableHead>
                  <TableHead>LRN</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {student.personalInfo?.firstName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.studentId || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.lrn || "—"}</TableCell>
                      <TableCell>{student.currentGradeLevel || "—"}</TableCell>
                      <TableCell>{student.section || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/registrar/students/${student._id}`}>
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
