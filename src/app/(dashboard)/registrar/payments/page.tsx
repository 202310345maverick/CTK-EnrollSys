"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Loader2, Receipt, X, CheckCircle, Ban,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";

const PAYMENT_TYPES = ["tuition", "miscellaneous", "other"];

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, count: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showVoided, setShowVoided] = useState(false);

  // Void modal state
  const [voidTarget, setVoidTarget] = useState<{ id: string; receiptNumber: string; amount: number } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState("");

  // Form state
  const [form, setForm] = useState({
    studentId: "",
    enrollmentId: "",
    schoolYearId: "",
    paymentType: "tuition",
    description: "",
    amount: "",
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const isAdminOrRegistrar = session?.user?.role === "admin" || session?.user?.role === "registrar";

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const url = showVoided ? "/api/payments?limit=200&includeVoided=true" : "/api/payments?limit=200";
      const res = await fetch(url);
      const data = await res.json();
      const list = data.payments || [];
      const nonVoided = list.filter((p: any) => !p.isVoided);
      const totalAmt = nonVoided.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      setPayments(list);
      setStats({ total: totalAmt, count: nonVoided.length, avg: nonVoided.length > 0 ? totalAmt / nonVoided.length : 0 });
    } finally {
      setLoading(false);
    }
  }, [showVoided]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    if (!showModal) return;
    fetch("/api/school-years").then(r => r.json()).then(d => setSchoolYears(d.schoolYears || []));
    fetch("/api/students?limit=200").then(r => r.json()).then(d => setStudents(d.students || []));
  }, [showModal]);

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const name = `${p.studentId?.personalInfo?.firstName || ""} ${p.studentId?.personalInfo?.lastName || ""}`.toLowerCase();
    const receipt = (p.receiptNumber || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    return name.includes(search.toLowerCase()) || receipt.includes(search.toLowerCase()) || desc.includes(search.toLowerCase());
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          paymentMethod: "cash",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to record payment");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setForm({ studentId: "", enrollmentId: "", schoolYearId: "", paymentType: "tuition", description: "", amount: "", paymentMethod: "cash", paymentDate: new Date().toISOString().split("T")[0], remarks: "" });
        fetchPayments();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const openVoidModal = (p: any) => {
    setVoidTarget({ id: p._id, receiptNumber: p.receiptNumber, amount: p.amount });
    setVoidReason("");
    setVoidError("");
  };

  const handleVoid = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) { setVoidError("Void reason is required."); return; }
    setVoidSubmitting(true);
    setVoidError("");
    try {
      const res = await fetch(`/api/payments/${voidTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voidReason: voidReason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setVoidError(d.error || "Failed to void payment");
        return;
      }
      setVoidTarget(null);
      fetchPayments();
    } finally {
      setVoidSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fee & Payment Management"
        description="Record and track student payments"
        actions={
          <Button onClick={() => setShowModal(true)} size="sm" className="ctk-danger-button h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Record Payment
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Collections", value: formatCurrency(stats.total), color: "text-emerald-600" },
          { label: "Transactions", value: stats.count.toString(), color: "text-foreground" },
          { label: "Average Payment", value: formatCurrency(stats.avg), color: "text-foreground" },
        ].map((s) => (
          <Card key={s.label} className="ctk-panel">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="ctk-panel">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showVoided}
                onChange={(e) => setShowVoided(e.target.checked)}
                className="rounded"
              />
              Show voided
            </label>
            <CardDescription className="ml-auto text-xs">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Receipt #</TableHead>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  {isAdminOrRegistrar && <TableHead className="text-xs w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p._id} className={`text-sm ${p.isVoided ? "opacity-60" : ""}`}>
                    <TableCell className="font-mono text-xs">
                      <span className={p.isVoided ? "line-through text-muted-foreground" : ""}>{p.receiptNumber}</span>
                      {p.isVoided && (
                        <Badge className="ml-1.5 bg-red-100 text-red-700 border border-red-200 text-[10px] px-1 py-0">
                          voided
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {p.studentId?.personalInfo?.lastName}, {p.studentId?.personalInfo?.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.studentId?.studentId || "—"}</p>
                    </TableCell>
                    <TableCell className="text-xs">{p.description}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.paymentType}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${p.isVoided ? "text-muted-foreground line-through" : "text-emerald-600"}`}>
                      {formatCurrency(p.amount)}
                    </TableCell>
                    {isAdminOrRegistrar && (
                      <TableCell className="text-right">
                        {!p.isVoided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openVoidModal(p)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Void
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Record Payment</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="h-7 w-7 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="flex flex-col items-center py-6 gap-2 text-emerald-600">
                  <CheckCircle className="h-10 w-10" />
                  <p className="font-semibold text-sm">Payment recorded successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Student *</label>
                      <FormSelect
                        value={form.studentId}
                        onChange={(v) => setForm(f => ({ ...f, studentId: v }))}
                        placeholder="Select student"
                        options={students.map((s: any) => ({
                          value: s._id,
                          label: `${s.personalInfo?.lastName}, ${s.personalInfo?.firstName}`,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">School Year *</label>
                      <FormSelect
                        value={form.schoolYearId}
                        onChange={(v) => setForm(f => ({ ...f, schoolYearId: v }))}
                        placeholder="Select school year"
                        options={schoolYears.map((sy: any) => ({
                          value: sy._id,
                          label: `${sy.name || sy.year}${sy.isActive ? " (Active)" : ""}`,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Type *</label>
                      <FormSelect
                        value={form.paymentType}
                        onChange={(v) => setForm(f => ({ ...f, paymentType: v }))}
                        options={PAYMENT_TYPES.map((t) => ({
                          value: t,
                          label: t.charAt(0).toUpperCase() + t.slice(1),
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method</label>
                      <div className="flex h-8 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                        Cash
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Date *</label>
                      <DatePicker
                        value={form.paymentDate}
                        onChange={(v) => setForm(f => ({ ...f, paymentDate: v }))}
                        placeholder="Select date"
                        minYear={2020}
                        maxYear={2035}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                    <Input
                      required
                      placeholder="e.g. Tuition fee for Q1"
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Remarks</label>
                    <Input
                      placeholder="Optional remarks"
                      value={form.remarks}
                      onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="flex-1 h-8 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={submitting} className="flex-1 h-8 text-xs ctk-danger-button">
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      {submitting ? "Saving..." : "Record Payment"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Void Payment Modal */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-red-700">Void Payment</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setVoidTarget(null)} className="h-7 w-7 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-red-50/50 p-3 text-xs">
                <p className="text-muted-foreground">Receipt: <span className="font-mono font-semibold">{voidTarget.receiptNumber}</span></p>
                <p className="text-muted-foreground">Amount: <span className="font-semibold text-red-700">{formatCurrency(voidTarget.amount)}</span></p>
              </div>
              {voidError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{voidError}</p>}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Void Reason *</label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="State the reason for voiding this payment..."
                  className="w-full rounded-md border px-3 py-2 text-xs min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setVoidTarget(null)} className="flex-1 h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={voidSubmitting}
                  onClick={handleVoid}
                  className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {voidSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Ban className="h-3.5 w-3.5 mr-1" />}
                  Confirm Void
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

