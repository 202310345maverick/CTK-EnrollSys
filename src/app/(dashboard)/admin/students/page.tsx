import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye, Plus, Users } from "lucide-react";

async function getStudentRows() {
  await dbConnect();

  const students = await Student.find()
    .populate("parentUserId", "email")
    .sort({ createdAt: -1 })
    .lean();

  return students as Array<{
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

function statusPill(status?: string) {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "graduated") return "bg-orange-100 text-orange-800";
  if (status === "transferred") return "bg-yellow-100 text-yellow-800";
  return "bg-slate-100 text-slate-700";
}

export default async function AdminStudentsPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    return null;
  }

  const [students, summary] = await Promise.all([getStudentRows(), getSummary()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Records Management</h2>
          <p className="text-muted-foreground">Search, view, and manage student records</p>
        </div>
        <Button className="h-11 rounded-xl px-5">
          <Plus className="mr-2 h-4 w-4" />
          Create New Record
        </Button>
      </div>

      <Card className="ctk-panel">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
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
          <CardTitle className="text-base">All Student Records</CardTitle>
          <CardDescription>{students.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8" />
              No student records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Parent Email</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} className="border-b last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-primary">{student.studentId || "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {student.personalInfo?.firstName || ""} {student.personalInfo?.lastName || ""}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{student.currentGradeLevel || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusPill(student.status)}`}>
                          {student.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{student.parentUserId?.email || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
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
