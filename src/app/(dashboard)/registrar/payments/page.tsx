"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Loader2, Receipt, X, CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const METHOD_COLORS: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  gcash: "bg-blue-100 text-blue-800 border border-blue-200",
  bank_transfer: "bg-purple-100 text-purple-800 border border-purple-200",
  check: "bg-amber-100 text-amber-800 border border-amber-200",
  other: "bg-slate-100 text-slate-600 border border-slate-200",
};

const PAYMENT_TYPES = ["tuition", "miscellaneous", "other"];
const PAYMENT_METHODS = ["cash", "gcash", "bank_transfer", "check", "other"];

export default function PaymentsPage() {
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

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments?limit=200");
      const data = await res.json();
      const list = data.payments || [];
      const totalAmt = list.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      setPayments(list);
      setStats({ total: totalAmt, count: list.length, avg: list.length > 0 ? totalAmt / list.length : 0 });
    } finally {
      setLoading(false);
    }
  }, []);

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
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
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
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p._id} className="text-sm">
                    <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {p.studentId?.personalInfo?.lastName}, {p.studentId?.personalInfo?.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.studentId?.studentId || "—"}</p>
                    </TableCell>
                    <TableCell className="text-xs">{p.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_COLORS[p.paymentMethod] || METHOD_COLORS.other}`}>
                        {p.paymentMethod?.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </TableCell>
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
                      <select
                        required
                        value={form.studentId}
                        onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                      >
                        <option value="">Select student</option>
                        {students.map((s: any) => (
                          <option key={s._id} value={s._id}>
                            {s.personalInfo?.lastName}, {s.personalInfo?.firstName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">School Year *</label>
                      <select
                        required
                        value={form.schoolYearId}
                        onChange={(e) => setForm(f => ({ ...f, schoolYearId: e.target.value }))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                      >
                        <option value="">Select school year</option>
                        {schoolYears.map((sy: any) => (
                          <option key={sy._id} value={sy._id}>
                            {sy.name || sy.year} {sy.isActive ? "(Active)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Type *</label>
                      <select
                        required
                        value={form.paymentType}
                        onChange={(e) => setForm(f => ({ ...f, paymentType: e.target.value }))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                      >
                        {PAYMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method *</label>
                      <select
                        required
                        value={form.paymentMethod}
                        onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
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
                      <Input
                        type="date"
                        required
                        value={form.paymentDate}
                        onChange={(e) => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                        className="h-8 text-sm"
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
    </div>
  );
}
