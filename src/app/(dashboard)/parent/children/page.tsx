import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText } from "lucide-react";
import Link from "next/link";

async function getChildren(userId: string) {
  await dbConnect();
  const children = await Student.find({ parentUserId: userId }).lean();
  return children;
}

export default async function ParentChildrenPage() {
  const session = await getServerSession(authOptions);
  const children = await getChildren(session?.user?.id || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Children</h2>
          <p className="text-muted-foreground">
            View your registered students
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Enroll New Student
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
          <CardDescription>{children.length} students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students yet</h3>
              <p className="text-muted-foreground">Enroll your first child to get started</p>
              <Link href="/parent/enrollment/new">
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Enroll a Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child: any) => (
                <Card key={child._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-lg">
                            {child.personalInfo?.firstName?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {child.personalInfo?.firstName} {child.personalInfo?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {child.currentGradeLevel || "Not enrolled"} {child.section ? `- ${child.section}` : ""}
                          </p>
                          {child.lrn && (
                            <p className="text-xs text-muted-foreground font-mono">LRN: {child.lrn}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        child.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {child.status}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Link href={`/parent/children/${child._id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
