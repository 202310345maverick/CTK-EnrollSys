"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { GRADE_LEVELS } from "@/lib/grade-levels";

type FeeItem = { description: string; amount: number; isRequired: boolean };
type SchoolYearOption = { _id: string; name: string };

type FeeStructure = {
  _id: string;
  gradeLevel: string;
  fees: FeeItem[];
  totalAmount: number;
  isActive: boolean;
  schoolYearId: { _id: string; name: string } | null;
};

export default function RegistrarFeeStructuresPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fsRes, syRes] = await Promise.all([
        fetch("/api/fee-structures"),
        fetch("/api/school-years"),
      ]);
      const fsData = await fsRes.json();
      const syData = await syRes.json();

      setFeeStructures(fsData.feeStructures || []);
      setSchoolYears(syData.schoolYears || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleFeeStructures =
    selectedSchoolYear === "all"
      ? feeStructures
      : feeStructures.filter((fs) => fs.schoolYearId?._id === selectedSchoolYear);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fee Structures</h1>
          <p className="text-xs text-slate-500">Review fee schedules for each grade level and school year</p>
        </div>
        <Link href="/registrar">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          School year filter
        </label>
        <select
          value={selectedSchoolYear}
          onChange={(e) => setSelectedSchoolYear(e.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All school years</option>
          {schoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {sy.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading fee structures...</CardContent>
        </Card>
      ) : visibleFeeStructures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No fee structures available</p>
            <p className="text-xs text-muted-foreground mt-1">Please check the selected school year or contact the admin office.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFeeStructures.map((fs) => (
            <Card key={fs._id} className={fs.isActive ? "" : "opacity-70"}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">{fs.gradeLevel}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{fs.schoolYearId?.name || "—"}</p>
                  </div>
                  <Badge variant={fs.isActive ? "success" : "neutral"}>{fs.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  {(fs.fees || []).map((fee, idx) => (
                    <div key={`${fs._id}-${fee.description}-${idx}`} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[170px]">{fee.description}</span>
                      <span className="font-medium text-slate-800 shrink-0 ml-2">{formatCurrency(fee.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(fs.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        Available grade levels: {GRADE_LEVELS.join(" • ")}
      </div>
    </div>
  );
}
