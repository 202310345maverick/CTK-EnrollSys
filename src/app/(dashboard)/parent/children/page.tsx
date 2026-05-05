import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Children</h1>
          <p className="text-xs text-slate-500">
            {children.length} {children.length === 1 ? "student" : "students"} linked to your account
          </p>
        </div>
        <Link href="/parent/enrollment/new">
          <Button size="sm" className="bg-[#b4040d] hover:bg-[#b4040d]/90">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Enroll New Student
          </Button>
        </Link>
      </div>

      {children.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">No Students Yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Enroll your first child to get started</p>
            <Link href="/parent/enrollment/new">
              <Button size="sm" className="mt-3 bg-[#b4040d] hover:bg-[#b4040d]/90">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Enroll Your First Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {children.map((child: any) => (
            <Card key={child._id} className="ctk-card-interactive group overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-sm font-bold">
                        {child.personalInfo?.firstName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors truncate">
                        {child.personalInfo?.firstName} {child.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {child.currentGradeLevel || "Not enrolled"}{child.section ? ` • ${child.section}` : ""}
                      </p>
                      {child.lrn && (
                        <p className="text-xs font-mono text-muted-foreground">LRN: {child.lrn}</p>
                      )}
                    </div>
                    <Badge
                      variant={child.status === "active" ? "success" : "neutral"}
                      className="capitalize text-xs"
                    >
                      {child.status}
                    </Badge>
                  </div>
                  <div className="border-t pt-2">
                    <Link href={`/parent/children/${child._id}`} className="w-full">
                      <Button variant="outline" className="w-full h-7 text-xs" size="sm">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
