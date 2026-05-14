"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Pencil, Trash2, X, PlusCircle, MinusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import { formatCurrency } from "@/lib/utils";

type FeeItem = { description: string; amount: number; isRequired: boolean };
type SchoolYearOption = { _id: string; name: string };
type FeeStructure = {
  _id: string;
  gradeLevel: string;
  fees: FeeItem[];
  totalAmount: number;
  isActive: boolean;
  schoolYearId: { _id: string; name: string } | null;
  paymentOptions: { name: string; installments: number; discount?: number }[];
};

import { GRADE_LEVELS } from "@/lib/grade-levels";

const labelCls = "block text-xs font-medium text-gray-700";

const emptyFee = (): FeeItem => ({ description: "", amount: 0, isRequired: true });
const emptyForm = () => ({
  schoolYearId: "",
  gradeLevel: "Pre-Kindergarten",
  isActive: true,
  fees: [emptyFee()],
});

const calcTotal = (fees: FeeItem[]) => fees.reduce((s, f) => s + (Number(f.amount) || 0), 0);

const updateFee = (arr: FeeItem[], idx: number, field: keyof FeeItem, val: any): FeeItem[] =>
  arr.map((f, i) => (i === idx ? { ...f, [field]: field === "amount" ? Number(val) : val } : f));

function FeeEditor({ fees, setFees }: { fees: FeeItem[]; setFees: (f: FeeItem[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Fee Items</label>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary px-1 flex items-center gap-1" onClick={() => setFees([...fees, emptyFee()])}>
          <PlusCircle className="h-3.5 w-3.5" /> Add Fee
        </Button>
      </div>
      {fees.map((fee, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            required
            placeholder="Description"
            className="h-8 text-sm flex-1"
            value={fee.description}
            onChange={(e) => setFees(updateFee(fees, idx, "description", e.target.value))}
          />
          <Input
            required
            type="number"
            min="0"
            placeholder="Amount"
            className="h-8 text-sm w-28"
            value={fee.amount || ""}
            onChange={(e) => setFees(updateFee(fees, idx, "amount", e.target.value))}
          />
          <label className="flex items-center gap-1 text-xs shrink-0">
            <input
              type="checkbox"
              checked={fee.isRequired}
              onChange={(e) => setFees(updateFee(fees, idx, "isRequired", e.target.checked))}
              className="h-3.5 w-3.5"
            />
            Req.
          </label>
          {fees.length > 1 && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => setFees(fees.filter((_, i) => i !== idx))}>
              <MinusCircle className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Total: <span className="font-semibold text-foreground">{formatCurrency(calcTotal(fees))}</span>
      </p>
    </div>
  );
}

export default function FeeStructuresPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState(emptyForm());
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/fee-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolYearId: form.schoolYearId,
          gradeLevel: form.gradeLevel,
          fees: form.fees,
          totalAmount: calcTotal(form.fees),
          isActive: form.isActive,
          paymentOptions: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to create"); return; }
      setShowCreate(false);
      await load();
    } catch { setFormError("Network error"); }
    finally { setFormLoading(false); }
  };

  const openEdit = (fs: FeeStructure) => {
    setEditId(fs._id);
    setEditForm({
      schoolYearId: typeof fs.schoolYearId === "object" ? fs.schoolYearId?._id || "" : fs.schoolYearId || "",
      gradeLevel: fs.gradeLevel,
      isActive: fs.isActive,
      fees: fs.fees.length ? fs.fees : [emptyFee()],
    });
    setEditError("");
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/fee-structures/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolYearId: editForm.schoolYearId,
          gradeLevel: editForm.gradeLevel,
          fees: editForm.fees,
          totalAmount: calcTotal(editForm.fees),
          isActive: editForm.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to update"); return; }
      setShowEdit(false);
      await load();
    } catch { setEditError("Network error"); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fee structure?")) return;
    await fetch(`/api/fee-structures/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-xs text-slate-500">Configure tuition and fees per grade level</p>
        </div>
        <Button className="ctk-danger-button h-8 text-xs" onClick={() => { setShowCreate(true); setForm(emptyForm()); setFormError(""); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Fee Structure
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
      ) : feeStructures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No fee structures yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create fee structures for each grade level</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {feeStructures.map((fs) => (
            <Card key={fs._id} className={fs.isActive ? "" : "opacity-60"}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{fs.gradeLevel}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{fs.schoolYearId?.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={fs.isActive ? "success" : "neutral"}>{fs.isActive ? "Active" : "Inactive"}</Badge>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(fs)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(fs._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1">
                  {(fs.fees || []).map((fee, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[160px]">{fee.description}</span>
                      <span className="font-medium shrink-0 ml-2">{formatCurrency(fee.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex items-center justify-between">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(fs.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Create Fee Structure</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" type="button" onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>School Year</label>
                  <FormSelect
                    value={form.schoolYearId}
                    onChange={(v) => setForm((p) => ({ ...p, schoolYearId: v }))}
                    placeholder="Select..."
                    options={schoolYears.map((sy) => ({ value: sy._id, label: sy.name }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Grade Level</label>
                  <FormSelect
                    value={form.gradeLevel}
                    onChange={(v) => setForm((p) => ({ ...p, gradeLevel: v }))}
                    options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                  />
                </div>
              </div>
              <FeeEditor fees={form.fees} setFees={(fees) => setForm((p) => ({ ...p, fees }))} />
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                Active
              </label>
              {formError && <p className="mt-0.5 text-xs text-red-500">{formError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" className="ctk-danger-button h-8 text-xs" disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Edit Fee Structure</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" type="button" onClick={() => setShowEdit(false)}><X className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>School Year</label>
                  <FormSelect
                    value={editForm.schoolYearId}
                    onChange={(v) => setEditForm((p) => ({ ...p, schoolYearId: v }))}
                    placeholder="Select..."
                    options={schoolYears.map((sy) => ({ value: sy._id, label: sy.name }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Grade Level</label>
                  <FormSelect
                    value={editForm.gradeLevel}
                    onChange={(v) => setEditForm((p) => ({ ...p, gradeLevel: v }))}
                    options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                  />
                </div>
              </div>
              <FeeEditor fees={editForm.fees} setFees={(fees) => setEditForm((p) => ({ ...p, fees }))} />
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                Active
              </label>
              {editError && <p className="mt-0.5 text-xs text-red-500">{editError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" className="ctk-danger-button h-8 text-xs" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
