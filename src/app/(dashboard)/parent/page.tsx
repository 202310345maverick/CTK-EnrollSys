import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Clock, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function ParentDashboard() {
  const children = [
    {
      id: 1,
      name: "Maria Santos Dela Cruz",
      grade: "Grade 3",
      section: "St. Peter",
      status: "Enrolled",
    },
    {
      id: 2,
      name: "Juan Santos Dela Cruz Jr.",
      grade: "Grade 1",
      section: "St. Paul",
      status: "Enrolled",
    },
  ];

  const enrollmentStatus = {
    pending: 0,
    approved: 2,
    rejected: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back!</h2>
          <p className="text-muted-foreground">
            Manage your children&apos;s enrollment and records
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Enroll a Student
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Children
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Applications
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentStatus.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentStatus.approved}</div>
            <p className="text-xs text-muted-foreground">This school year</p>
          </CardContent>
        </Card>
      </div>

      {/* My Children */}
      <Card>
        <CardHeader>
          <CardTitle>My Children</CardTitle>
          <CardDescription>Students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students yet</h3>
              <p className="text-muted-foreground">
                Start by enrolling your first child
              </p>
              <Link href="/parent/enrollment/new">
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Enroll a Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {child.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {child.grade} - {child.section}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {child.status}
                    </span>
                    <Link href={`/parent/children/${child.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 py-2 border-b">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Enrollment Approved</p>
                <p className="text-sm text-muted-foreground">
                  Maria Santos Dela Cruz - Grade 3 enrollment has been approved
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 py-2 border-b">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Documents Verified</p>
                <p className="text-sm text-muted-foreground">
                  All documents for Juan Santos Dela Cruz Jr. have been verified
                </p>
                <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
