"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, User, FileText, Calendar,
  AlertCircle, Loader2, ExternalLink, ShieldCheck, RotateCcw, DollarSign,
} from "lucide-react";
import { ENROLLMENT_DOCUMENT_LABELS } from "@/lib/enrollment/constants";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  rejected: "bg-red-100 text-red-800 border border-red-200",
  enrolled: "bg-purple-100 text-purple-800 border border-purple-200",
  waitlisted: "bg-slate-100 text-slate-700 border border-slate-200",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  missing: "bg-slate-50 text-slate-500",
};

const formatDate = (date: string | undefined) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);

export default function EnrollmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [feeDescription, setFeeDescription] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<{ description: string; amount: number }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEnrollment = () => {
    fetch(`/api/enrollments/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEnrollment(data.enrollment);
        setRemarks(data.enrollment?.remarks || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEnrollment(); }, [params.id]);

  const updateStatus = async (status: string) => {
    if (!remarks.trim() && (status === "rejected")) {
      showToast("Please add remarks before rejecting.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/enrollments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Status updated to ${status.replace("_", " ")}`);
      fetchEnrollment();
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateDocStatus = async (docType: string, status: "verified" | "rejected" | "pending", docRemarks?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/enrollments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUpdate: { documentType: docType, status, remarks: docRemarks } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Document ${status}`);
      fetchEnrollment();
    } catch (e: any) {
      showToast(e.message || "Failed to update document", "error");
    } finally {
      setSaving(false);
    }
  };

  const addFeeItem = () => {
    const amt = parseFloat(feeAmount);
    if (!feeDescription.trim() || isNaN(amt) || amt <= 0) return;
    setFeeBreakdown((prev) => [...prev, { description: feeDescription.trim(), amount: amt }]);
    setFeeDescription("");
    setFeeAmount("");
  };

  const removeFeeItem = (i: number) => setFeeBreakdown((prev) => prev.filter((_, idx) => idx !== i));

  const saveAssessedFees = async () => {
    if (feeBreakdown.length === 0) return;
    setSaving(true);
    const totalAmount = feeBreakdown.reduce((s, f) => s + f.amount, 0);
    try {
      const res = await fetch(`/api/enrollments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessedFees: { totalAmount, breakdown: feeBreakdown } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Fees assessed successfully");
      setFeeBreakdown([]);
      fetchEnrollment();
    } catch (e: any) {
      showToast(e.message || "Failed to assess fees", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="space-y-4">
        <Link href="/registrar/enrollments">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enrollment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = enrollment.studentId;
  const canReview = enrollment.status === "pending" || enrollment.status === "under_review";
  const statusClass = STATUS_COLORS[enrollment.status] || STATUS_COLORS.pending;

  return (
    <div className="space-y-4 pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-2.5 text-sm shadow-lg ${
          toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/registrar/enrollments">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Enrollment Review</h1>
          <p className="font-mono text-xs text-muted-foreground">{enrollment.enrollmentNumber}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
          {enrollment.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Student Info */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" /> Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                {[
                  ["Full Name", `${student?.personalInfo?.firstName || ""} ${student?.personalInfo?.middleName || ""} ${student?.personalInfo?.lastName || ""}`.trim()],
                  ["Gender", student?.personalInfo?.gender || "—"],
                  ["Date of Birth", student?.personalInfo?.birthDate ? new Date(student.personalInfo.birthDate).toLocaleDateString("en-PH") : "—"],
                  ["LRN", student?.lrn || "—"],
                  ["Grade Level", enrollment.gradeLevel || "—"],
                  ["Enrollment Type", enrollment.enrollmentType || "—"],
                  ["School Year", enrollment.schoolYearId?.name || "—"],
                  ["Section Preference", enrollment.sectionPreference || "No preference"],
                  ["Contact No.", student?.contactInfo?.contactNumber || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {enrollment.previousSchool?.name && (
                <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-slate-700">Previous School</p>
                  <p>{enrollment.previousSchool.name}</p>
                  <p className="text-muted-foreground">Last Grade: {enrollment.previousSchool.lastGradeCompleted}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" /> Submitted Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {enrollment.documents?.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No documents submitted.</p>
              ) : (
                <div className="space-y-2">
                  {enrollment.documents?.map((doc: any, i: number) => {
                    const docId = doc.documentId as any;
                    const label = ENROLLMENT_DOCUMENT_LABELS[doc.type as keyof typeof ENROLLMENT_DOCUMENT_LABELS] || doc.type;
                    const fileUrl = docId?.secureUrl || docId?.cloudinaryUrl;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg border bg-slate-50/50 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{label}</p>
                          <p className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-xs font-medium capitalize ${DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.pending}`}>
                            {doc.status}
                          </p>
                          {doc.remarks && <p className="mt-0.5 text-xs text-muted-foreground italic">{doc.remarks}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-6 px-1.5 text-xs">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                          {doc.status !== "verified" && (
                            <Button
                              size="sm"
                              className="h-6 px-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => updateDocStatus(doc.type, "verified")}
                              disabled={saving}
                            >
                              <ShieldCheck className="h-3 w-3" />
                            </Button>
                          )}
                          {doc.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-1.5 text-xs"
                              onClick={() => updateDocStatus(doc.type, "rejected", "Document rejected — please re-upload")}
                              disabled={saving}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {doc.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-1.5 text-xs"
                              onClick={() => updateDocStatus(doc.type, "pending")}
                              disabled={saving}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Assessment */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <DollarSign className="h-4 w-4 text-primary" /> Fee Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {enrollment.assessedFees?.breakdown?.length > 0 && (
                <div className="rounded-lg border bg-emerald-50/50 p-3">
                  <p className="mb-2 text-xs font-semibold text-emerald-800">Current Assessment</p>
                  <div className="space-y-1">
                    {enrollment.assessedFees.breakdown.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{b.description}</span>
                        <span className="font-mono font-medium">{formatCurrency(b.amount)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t pt-1 text-xs font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(enrollment.assessedFees.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs font-medium text-slate-700">Add Fee Items</p>
              <div className="flex gap-2">
                <input
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  placeholder="Description (e.g. Tuition Fee)"
                  className="h-8 flex-1 rounded-md border px-2 text-xs"
                />
                <input
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="Amount"
                  type="number"
                  className="h-8 w-28 rounded-md border px-2 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addFeeItem}>Add</Button>
              </div>
              {feeBreakdown.length > 0 && (
                <div className="rounded-lg border p-3 space-y-1">
                  {feeBreakdown.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{f.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(f.amount)}</span>
                        <button onClick={() => removeFeeItem(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-1 text-xs font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(feeBreakdown.reduce((s, f) => s + f.amount, 0))}</span>
                  </div>
                  <Button size="sm" className="mt-2 h-7 w-full text-xs bg-[#b4040d] hover:bg-[#b4040d]/90" onClick={saveAssessedFees} disabled={saving}>
                    {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Save Fee Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Review Actions */}
          {canReview && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Review Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {enrollment.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => updateStatus("under_review")}
                    disabled={saving}
                  >
                    <Clock className="mr-1.5 h-3.5 w-3.5" /> Mark Under Review
                  </Button>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-700">Remarks / Notes</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-xs min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Add remarks for the parent..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => updateStatus("rejected")}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateStatus("approved")}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                    Approve
                  </Button>
                </div>
                {enrollment.status === "approved" && (
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700"
                    onClick={() => updateStatus("enrolled")}
                    disabled={saving}
                  >
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Mark as Enrolled
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Status History
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {enrollment.statusHistory?.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...(enrollment.statusHistory || [])].reverse().map((h: any, i: number) => (
                    <div key={i} className="flex gap-2.5 text-xs">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="font-semibold capitalize">{h.status.replace("_", " ")}</p>
                        <p className="text-muted-foreground">{formatDate(h.changedAt)}</p>
                        {h.remarks && <p className="italic text-muted-foreground">{h.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Remarks */}
          {enrollment.remarks && !canReview && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Remarks</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xs text-slate-700">{enrollment.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

