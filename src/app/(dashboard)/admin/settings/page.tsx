"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Shield, Users2, FileCheck, Loader2, Save, Info } from "lucide-react";

const labelCls = "block text-xs font-medium text-slate-700 mb-1";
const inputCls = "h-8 text-xs w-full";

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <div>
      <p className="text-xs font-medium">{label}</p>
      {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-[#b4040d]" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

const defaultSettings = {
  schoolName: "Christ the King Catholic School",
  schoolShortName: "CTK",
  schoolAddress: "Olongapo City, Zambales",
  schoolEmail: "",
  schoolPhone: "",
  maxStudentsPerSection: 40,
  allowParentSelfRegistration: true,
  requireDocumentUploadOnSubmit: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast("Settings saved successfully");
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: unknown) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-4 pb-8">
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-2.5 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-slate-500">Manage system configuration and school information</p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-[#b4040d] hover:bg-[#b4040d]/90 gap-1.5"
          onClick={save}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* School Information */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" /> School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>School Name</label>
              <Input
                className={inputCls}
                value={settings.schoolName}
                onChange={(e) => set("schoolName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Short Name</label>
                <Input
                  className={inputCls}
                  value={settings.schoolShortName}
                  onChange={(e) => set("schoolShortName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <Input
                  className={inputCls}
                  value={settings.schoolPhone}
                  onChange={(e) => set("schoolPhone", e.target.value)}
                  placeholder="+63..."
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <Input
                className={inputCls}
                value={settings.schoolAddress}
                onChange={(e) => set("schoolAddress", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>School Email</label>
              <Input
                className={inputCls}
                type="email"
                value={settings.schoolEmail}
                onChange={(e) => set("schoolEmail", e.target.value)}
                placeholder="school@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Settings */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Users2 className="h-4 w-4 text-primary" /> Enrollment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Max Students per Section</label>
              <Input
                className={inputCls}
                type="number"
                min={1}
                max={100}
                value={settings.maxStudentsPerSection}
                onChange={(e) => set("maxStudentsPerSection", parseInt(e.target.value) || 40)}
              />
            </div>
            <Toggle
              checked={settings.allowParentSelfRegistration}
              onChange={(v) => set("allowParentSelfRegistration", v)}
              label="Allow Parent Self-Registration"
              description="Parents can create their own accounts on the sign-up page"
            />
            <Toggle
              checked={settings.requireDocumentUploadOnSubmit}
              onChange={(v) => set("requireDocumentUploadOnSubmit", v)}
              label="Require Documents on Submit"
              description="Enrollment cannot be submitted without uploading required documents"
            />
          </CardContent>
        </Card>

        {/* Security (read-only env vars) */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Security (Read-only)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(
              [
                ["Max Failed Login Attempts", process.env.NEXT_PUBLIC_AUTH_MAX_FAILED_LOGIN_ATTEMPTS || "5"],
                ["Account Lockout Duration", `${process.env.NEXT_PUBLIC_AUTH_LOCKOUT_MINUTES || "30"} minutes`],
                ["Password Reset Token TTL", `${process.env.NEXT_PUBLIC_AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES || "60"} minutes`],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium">{value}</span>
              </div>
            ))}
            <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Configure via AUTH_* environment variables.
            </p>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-primary" /> System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(
              [
                ["SMTP Status", process.env.SMTP_HOST ? "Configured" : "Not configured"],
                ["Cloudinary Status", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured"],
                ["Database", "MongoDB (Atlas)"],
                ["Runtime", "Next.js 14 App Router"],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span
                  className={`text-xs font-medium ${
                    value === "Not configured"
                      ? "text-amber-600"
                      : value === "Configured"
                      ? "text-emerald-600"
                      : ""
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
