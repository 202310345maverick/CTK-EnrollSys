"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SchoolYear = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentPeriod: { start: string; end: string };
  gradeLevels: string[];
  status: "upcoming" | "enrollment" | "ongoing" | "completed";
  isActive: boolean;
};

const labelCls = "block text-xs font-medium text-gray-700";
const inputCls = "mt-1 h-8 text-sm w-full border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary";
const selectCls = "mt-1 h-8 text-sm w-full border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary bg-white";

const EMPTY_FORM = {
  name: "",
  startDate: "",
  endDate: "",
  enrollmentStart: "",
  enrollmentEnd: "",
  status: "upcoming" as SchoolYear["status"],
  isActive: false,
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

const statusVariant = (s: string) => {
  switch (s) {
    case "enrollment": return "info";
    case "ongoing": return "success";
    case "completed": return "neutral";
    default: return "warning";
  }
};

export default function SchoolYearsPage() {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school-years");
      const data = await res.json();
      setSchoolYears(data.schoolYears || []);
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
      const res = await fetch("/api/school-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          enrollmentPeriod: { start: form.enrollmentStart, end: form.enrollmentEnd },
          status: form.status,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to create"); return; }
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      await load();
    } catch { setFormError("Network error"); }
    finally { setFormLoading(false); }
  };

  const openEdit = (sy: SchoolYear) => {
    setEditId(sy._id);
    setEditForm({
      name: sy.name,
      startDate: sy.startDate ? sy.startDate.slice(0, 10) : "",
      endDate: sy.endDate ? sy.endDate.slice(0, 10) : "",
      enrollmentStart: sy.enrollmentPeriod?.start ? sy.enrollmentPeriod.start.slice(0, 10) : "",
      enrollmentEnd: sy.enrollmentPeriod?.end ? sy.enrollmentPeriod.end.slice(0, 10) : "",
      status: sy.status,
      isActive: sy.isActive,
    });
    setEditError("");
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/school-years/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          enrollmentPeriod: { start: editForm.enrollmentStart, end: editForm.enrollmentEnd },
          status: editForm.status,
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
    if (!confirm("Delete this school year?")) return;
    await fetch(`/api/school-years/${id}`, { method: "DELETE" });
    await load();
  };

  const handleToggleEnrollment = async (sy: SchoolYear) => {
    const newStatus = sy.status === "enrollment" ? "ongoing" : "enrollment";
    await fetch(`/api/school-years/${sy._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">School Years</h1>
          <p className="text-xs text-slate-500">Configure academic years and enrollment periods</p>
        </div>
        <Button className="ctk-danger-button h-8 text-xs" onClick={() => { setShowCreate(true); setForm({ ...EMPTY_FORM }); setFormError(""); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add School Year
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            All School Years
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
          ) : schoolYears.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No school years configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">School Year Period</TableHead>
                    <TableHead className="text-xs">Enrollment Period</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Active</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolYears.map((sy) => (
                    <TableRow key={sy._id}>
                      <TableCell className="text-xs font-medium">{sy.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(sy.startDate)} – {fmt(sy.endDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(sy.enrollmentPeriod?.start)} – {fmt(sy.enrollmentPeriod?.end)}</TableCell>
                      <TableCell><Badge variant={statusVariant(sy.status) as any}>{sy.status}</Badge></TableCell>
                      <TableCell><Badge variant={sy.isActive ? "success" : "neutral"}>{sy.isActive ? "Yes" : "No"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs px-2 ${sy.status === "enrollment" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
                            onClick={() => handleToggleEnrollment(sy)}
                            title={sy.status === "enrollment" ? "Close Enrollment" : "Open Enrollment"}
                          >
                            {sy.status === "enrollment" ? <ToggleRight className="h-3.5 w-3.5 mr-1" /> : <ToggleLeft className="h-3.5 w-3.5 mr-1" />}
                            {sy.status === "enrollment" ? "Close" : "Open"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(sy)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => handleDelete(sy._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Create School Year</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className={labelCls}>Name (e.g. 2024-2025)</label>
                <input required className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <DatePicker value={form.startDate} onChange={(v) => setForm((p) => ({ ...p, startDate: v }))} minYear={2020} maxYear={2035} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <DatePicker value={form.endDate} onChange={(v) => setForm((p) => ({ ...p, endDate: v }))} minYear={2020} maxYear={2035} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Enrollment Start</label>
                  <DatePicker value={form.enrollmentStart} onChange={(v) => setForm((p) => ({ ...p, enrollmentStart: v }))} minYear={2020} maxYear={2035} />
                </div>
                <div>
                  <label className={labelCls}>Enrollment End</label>
                  <DatePicker value={form.enrollmentEnd} onChange={(v) => setForm((p) => ({ ...p, enrollmentEnd: v }))} minYear={2020} maxYear={2035} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <FormSelect
                    value={form.status}
                    onChange={(v) => setForm((p) => ({ ...p, status: v as any }))}
                    options={[
                      { value: "upcoming", label: "Upcoming" },
                      { value: "enrollment", label: "Enrollment" },
                      { value: "ongoing", label: "Ongoing" },
                      { value: "completed", label: "Completed" },
                    ]}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                    Set as Active Year
                  </label>
                </div>
              </div>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Edit School Year</h2>
              <button onClick={() => setShowEdit(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className={labelCls}>Name</label>
                <input required className={inputCls} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <DatePicker value={editForm.startDate} onChange={(v) => setEditForm((p) => ({ ...p, startDate: v }))} minYear={2020} maxYear={2035} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <DatePicker value={editForm.endDate} onChange={(v) => setEditForm((p) => ({ ...p, endDate: v }))} minYear={2020} maxYear={2035} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Enrollment Start</label>
                  <DatePicker value={editForm.enrollmentStart} onChange={(v) => setEditForm((p) => ({ ...p, enrollmentStart: v }))} minYear={2020} maxYear={2035} />
                </div>
                <div>
                  <label className={labelCls}>Enrollment End</label>
                  <DatePicker value={editForm.enrollmentEnd} onChange={(v) => setEditForm((p) => ({ ...p, enrollmentEnd: v }))} minYear={2020} maxYear={2035} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <FormSelect
                    value={editForm.status}
                    onChange={(v) => setEditForm((p) => ({ ...p, status: v as any }))}
                    options={[
                      { value: "upcoming", label: "Upcoming" },
                      { value: "enrollment", label: "Enrollment" },
                      { value: "ongoing", label: "Ongoing" },
                      { value: "completed", label: "Completed" },
                    ]}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                    Set as Active Year
                  </label>
                </div>
              </div>
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


