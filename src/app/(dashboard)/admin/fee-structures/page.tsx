import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import FeeStructure from "@/models/FeeStructure";
import SchoolYear from "@/models/SchoolYear";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getFeeStructures() {
  await dbConnect();
  const feeStructures = await FeeStructure.find()
    .populate("schoolYear", "name")
    .sort({ createdAt: -1 })
    .lean();
  return feeStructures;
}

export default async function FeeStructuresPage() {
  const session = await getServerSession(authOptions);
  const feeStructures = await getFeeStructures();

  const gradeLevels = [
    "Kinder 1", "Kinder 2",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fee Structures</h2>
          <p className="text-muted-foreground">
            Configure tuition and miscellaneous fees per grade level
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {feeStructures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No fee structures configured</h3>
            <p className="text-muted-foreground">Create fee structures for each grade level</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Fee Structure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {feeStructures.map((fs: any) => (
            <Card key={fs._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{fs.gradeLevel}</CardTitle>
                    <CardDescription>
                      School Year: {fs.schoolYear?.name || "—"} • {fs.isActive ? "Active" : "Inactive"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Tuition Fee</p>
                    <p className="text-xl font-bold">{formatCurrency(fs.tuitionFee)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Registration Fee</p>
                    <p className="text-xl font-bold">{formatCurrency(fs.registrationFee)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Miscellaneous</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(fs.miscellaneousFees?.reduce((sum: number, f: any) => sum + f.amount, 0) || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(
                        fs.tuitionFee + 
                        fs.registrationFee + 
                        (fs.miscellaneousFees?.reduce((sum: number, f: any) => sum + f.amount, 0) || 0)
                      )}
                    </p>
                  </div>
                </div>
                
                {fs.miscellaneousFees && fs.miscellaneousFees.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Miscellaneous Fees Breakdown</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      {fs.miscellaneousFees.map((fee: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{fee.name}</span>
                          <span>{formatCurrency(fee.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
          <CardDescription>Create fee structures for all grade levels at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {gradeLevels.map((level) => (
              <Button key={level} variant="outline" size="sm">
                {level}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
