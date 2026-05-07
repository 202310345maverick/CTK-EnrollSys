"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Lock, Unlock, Loader2 } from "lucide-react";

interface Props {
  schoolYearId: string;
  schoolYearName: string;
  currentStatus: string;
}

export function EnrollmentPeriodControl({ schoolYearId, schoolYearName, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isOpen = status === "enrollment";

  const toggle = async () => {
    const newStatus = isOpen ? "ongoing" : "enrollment";
    setLoading(true);
    try {
      const res = await fetch(`/api/school-years/${schoolYearId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(newStatus);
      setToast(newStatus === "enrollment" ? "Enrollment period opened!" : "Enrollment period closed.");
      setTimeout(() => setToast(null), 3000);
    } catch (e: unknown) {
      setToast((e instanceof Error ? e.message : null) || "Failed to update");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={isOpen ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"}>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs shadow-lg">
          {toast}
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" /> Enrollment Period
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">{schoolYearName}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              />
              <span className="text-xs text-muted-foreground">
                {isOpen ? "Open for enrollment" : "Enrollment closed"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={isOpen ? "destructive" : "default"}
            className={`h-8 text-xs gap-1.5 ${!isOpen ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            onClick={toggle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOpen ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
            {isOpen ? "Close Enrollment" : "Open Enrollment"}
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          When open, parents can submit new enrollments. When closed, all new submissions are blocked.
        </p>
      </CardContent>
    </Card>
  );
}
