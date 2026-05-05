import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Phone, MapPin, FileText } from "lucide-react";
import Link from "next/link";

async function getStudent(studentId: string, userId: string) {
  await dbConnect();
  const student = await Student.findOne({ 
    _id: studentId, 
    parentUserId: userId 
  }).lean();
  return student;
}

export default async function ChildDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const student = await getStudent(params.id, session.user.id);

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/parent">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Student not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const address = (student as any).contactInfo?.address;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {(student as any).personalInfo?.firstName} {(student as any).personalInfo?.lastName}
          </h2>
          <p className="text-muted-foreground">
            {(student as any).currentGradeLevel || "Not enrolled"} {(student as any).section ? `- ${(student as any).section}` : ""}
          </p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full capitalize ${
          (student as any).status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {(student as any).status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {(student as any).personalInfo?.firstName} {(student as any).personalInfo?.middleName} {(student as any).personalInfo?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{(student as any).personalInfo?.gender || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate((student as any).personalInfo?.birthDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LRN</p>
                <p className="font-medium font-mono">{(student as any).lrn || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium font-mono">{(student as any).studentId || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade Level</p>
                <p className="font-medium">{(student as any).currentGradeLevel || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section</p>
                <p className="font-medium">{(student as any).section || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">School Year</p>
                <p className="font-medium">{(student as any).enrollmentHistory?.length ? "On file" : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="font-medium">
                {(student as any).contactInfo?.contactNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{(student as any).contactInfo?.email || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {address?.street || ""} {address?.barangay || ""}<br />
              {address?.city || ""}, {address?.province || ""} {address?.zipCode || ""}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
