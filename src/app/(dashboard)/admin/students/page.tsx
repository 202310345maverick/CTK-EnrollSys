import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Search, Filter, Eye, Plus, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getStudentRows() {
  await dbConnect();

  const students = await Student.find()
    .populate("parentUserId", "email")
    .sort({ createdAt: -1 })
    .lean();

  return students.map((student) => ({
    _id: String(student._id),
    studentId: student.studentId,
    currentGradeLevel: student.currentGradeLevel,
    status: student.status,
    personalInfo: {
      firstName: student.personalInfo?.firstName,
      lastName: student.personalInfo?.lastName,
    },
    parentUserId:
      student.parentUserId &&
      typeof student.parentUserId === "object" &&
      "email" in student.parentUserId
        ? { email: (student.parentUserId as { email?: string }).email }
        : undefined,
  })) as Array<{
    _id: string;
    studentId?: string;
    currentGradeLevel?: string;
    status?: "active" | "inactive" | "graduated" | "transferred";
    personalInfo?: {
      firstName?: string;
      lastName?: string;
    };
    parentUserId?: {
      email?: string;
    };
  }>;
}

async function getSummary() {
  await dbConnect();

  const [total, active, graduated] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: "active" }),
    Student.countDocuments({ status: "graduated" }),
  ]);

  return { total, active, graduated };
}

function statusVariant(status?: string): NonNullable<BadgeProps["variant"]> {
  if (status === "active") return "success";
  if (status === "graduated") return "warning";
  if (status === "transferred") return "pending";
  return "neutral";
}

export default async function AdminStudentsPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    return null;
  }

  const [students, summary] = await Promise.all([getStudentRows(), getSummary()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Records Management"
        description="Search, view, and manage student records"
        actions={
        <Button className="h-11 rounded-xl px-5 ctk-danger-button">
          <Plus className="mr-2 h-4 w-4" />
          Create New Record
        </Button>
        }
      />

      <Card className="ctk-panel">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or student ID..."
                className="ctk-input w-full border px-10"
              />
            </div>
            <select className="ctk-input w-full border px-3 text-sm">
              <option>All Grades</option>
            </select>
            <div className="flex gap-2">
              <select className="ctk-input flex-1 border px-3 text-sm">
                <option>Active</option>
                <option>Graduated</option>
                <option>Transferred</option>
                <option>Inactive</option>
              </select>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-emerald-700">{summary.active}</p>
              <p className="text-sm text-emerald-700">Active Students</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-orange-700">{summary.graduated}</p>
              <p className="text-sm text-orange-700">Graduated</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
              <p className="text-3xl font-bold text-slate-700">{summary.total}</p>
              <p className="text-sm text-slate-700">Total Records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="ctk-panel">
        <CardHeader>
          <CardTitle className="ctk-section-title">All Student Records</CardTitle>
          <CardDescription>{students.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8" />
              No student records found.
            </div>
          ) : (
            <Table className="ctk-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-semibold text-primary">{student.studentId || "—"}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {student.personalInfo?.firstName || ""} {student.personalInfo?.lastName || ""}
                      </TableCell>
                      <TableCell className="text-slate-700">{student.currentGradeLevel || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(student.status)}>
                          {student.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{student.parentUserId?.email || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
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
