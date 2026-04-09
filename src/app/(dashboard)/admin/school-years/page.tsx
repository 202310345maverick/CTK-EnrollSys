import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import SchoolYear from "@/models/SchoolYear";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Settings } from "lucide-react";

async function getSchoolYears() {
  await dbConnect();
  const schoolYears = await SchoolYear.find().sort({ startDate: -1 }).lean();
  return schoolYears;
}

export default async function SchoolYearsPage() {
  const session = await getServerSession(authOptions);
  const schoolYears = await getSchoolYears();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (sy: any) => {
    if (sy.isCurrent) return { label: "Current", class: "bg-green-100 text-green-800" };
    if (sy.enrollmentOpen) return { label: "Enrollment Open", class: "bg-blue-100 text-blue-800" };
    return { label: "Closed", class: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Years</h2>
          <p className="text-muted-foreground">
            Configure academic years and enrollment periods
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add School Year
        </Button>
      </div>

      {schoolYears.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No school years configured</h3>
            <p className="text-muted-foreground">Create a school year to start enrollment</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create School Year
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schoolYears.map((sy: any) => {
            const status = getStatusBadge(sy);
            return (
              <Card key={sy._id} className={sy.isCurrent ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sy.name}</CardTitle>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <CardDescription>
                    {formatDate(sy.startDate)} - {formatDate(sy.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Enrollment Period</span>
                    </div>
                    <div className="text-sm">
                      {formatDate(sy.enrollmentStartDate)} - {formatDate(sy.enrollmentEndDate)}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        sy.enrollmentOpen ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {sy.enrollmentOpen ? "Open" : "Closed"}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
