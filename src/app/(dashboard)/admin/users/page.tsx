"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { UserPlus, Search, Pencil, X } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRecord = {
  _id: string;
  email: string;
  role: "admin" | "registrar" | "parent";
  isActive: boolean;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    contactNumber: string;
    middleName?: string;
  };
};

const labelCls = "block text-xs font-medium text-gray-700";

const EMPTY_CREATE = { firstName: "", lastName: "", email: "", password: "", role: "parent" as const, contactNumber: "" };
const EMPTY_EDIT = { firstName: "", lastName: "", email: "", role: "parent" as "admin" | "registrar" | "parent", contactNumber: "", isActive: true };

const getRoleBadgeVariant = (role: string): NonNullable<BadgeProps["variant"]> => {
  switch (role) {
    case "admin": return "danger";
    case "registrar": return "warning";
    case "parent": return "success";
    default: return "neutral";
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users?limit=200");
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const name = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          profile: {
            firstName: createForm.firstName,
            lastName: createForm.lastName,
            contactNumber: createForm.contactNumber,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create user"); return; }
      setShowCreate(false);
      setCreateForm({ ...EMPTY_CREATE });
      await loadUsers();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (user: UserRecord) => {
    setEditId(user._id);
    setEditForm({
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      email: user.email,
      role: user.role,
      contactNumber: user.profile?.contactNumber || "",
      isActive: user.isActive,
    });
    setEditError("");
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/users/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editForm.email,
          role: editForm.role,
          profile: {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            contactNumber: editForm.contactNumber,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to update user"); return; }
      // Also update isActive if changed
      const orig = users.find((u) => u._id === editId);
      if (orig && orig.isActive !== editForm.isActive) {
        await fetch(`/api/users/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: editForm.isActive }),
        });
      }
      setShowEdit(false);
      await loadUsers();
    } catch {
      setEditError("Network error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    await loadUsers();
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-slate-500">Manage system users and access control</p>
        </div>
        <Button className="ctk-danger-button h-8 text-xs" onClick={() => { setShowCreate(true); setCreateForm({ ...EMPTY_CREATE }); setCreateError(""); }}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-2 text-sm"
              />
            </div>
            <FormSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All Roles" },
                { value: "admin", label: "Admin" },
                { value: "registrar", label: "Registrar" },
                { value: "parent", label: "Parent" },
              ]}
              className="flex-none w-36"
            />
            <FormSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="flex-none w-36"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">{filtered.length} Users</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Joined</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => {
                    const first = user.profile?.firstName || "";
                    const last = user.profile?.lastName || "";
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-primary font-bold text-xs">{getInitials(first, last) || user.email.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-xs font-medium">{first} {last}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                        <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge></TableCell>
                        <TableCell><Badge variant={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(user)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-7 text-xs px-2 ${user.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Create New User</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" type="button" onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <Input required className="mt-1 h-8 text-sm" value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <Input required className="mt-1 h-8 text-sm" value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <Input required type="email" className="mt-1 h-8 text-sm" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <Input required type="password" minLength={8} className="mt-1 h-8 text-sm" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role</label>
                  <FormSelect
                    value={createForm.role}
                    onChange={(v) => setCreateForm((p) => ({ ...p, role: v as any }))}
                    options={[
                      { value: "parent", label: "Parent" },
                      { value: "registrar", label: "Registrar" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact Number</label>
                  <Input required className="mt-1 h-8 text-sm" value={createForm.contactNumber} onChange={(e) => setCreateForm((p) => ({ ...p, contactNumber: e.target.value }))} />
                </div>
              </div>
              {createError && <p className="mt-0.5 text-xs text-red-500">{createError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" className="ctk-danger-button h-8 text-xs" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Edit User</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" type="button" onClick={() => setShowEdit(false)}><X className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <Input required className="mt-1 h-8 text-sm" value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <Input required className="mt-1 h-8 text-sm" value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <Input required type="email" className="mt-1 h-8 text-sm" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role</label>
                  <FormSelect
                    value={editForm.role}
                    onChange={(v) => setEditForm((p) => ({ ...p, role: v as any }))}
                    options={[
                      { value: "parent", label: "Parent" },
                      { value: "registrar", label: "Registrar" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact Number</label>
                  <Input required className="mt-1 h-8 text-sm" value={editForm.contactNumber} onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-xs text-gray-700">Active Account</label>
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
