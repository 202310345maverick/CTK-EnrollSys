"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Clock, Building2, Info } from "lucide-react";

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">{children}</CardContent>
  </Card>
);

const Row = ({ label, value, configured }: { label: string; value?: string; configured?: boolean }) => (
  <div className="flex items-center justify-between py-1.5 border-b last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    {configured !== undefined ? (
      <span className={`text-xs font-medium ${configured ? "text-emerald-600" : "text-slate-400"}`}>
        {configured ? "✓ Configured" : "Not configured"}
      </span>
    ) : (
      <span className="text-xs font-medium">{value || "—"}</span>
    )}
  </div>
);

export default function SettingsPage() {
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST_CONFIGURED === "true";
  const sessionTimeout = process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES || "30";

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-slate-500">System configuration viewer — settings are managed via environment variables</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="School Information" icon={Building2}>
          <Row label="School Name" value="Christ the King Catholic School" />
          <Row label="Short Name" value="CTK" />
          <Row label="Address" value="Olongapo City, Zambales" />
          <Row label="School ID" value="CTK-OLG-001" />
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            To change school info, update environment variables or constants.
          </p>
        </Section>

        <Section title="Password Policy" icon={Shield}>
          <Row label="Max Failed Login Attempts" value={process.env.NEXT_PUBLIC_AUTH_MAX_FAILED_LOGIN_ATTEMPTS || "5"} />
          <Row label="Account Lockout Duration" value={`${process.env.NEXT_PUBLIC_AUTH_LOCKOUT_MINUTES || "30"} minutes`} />
          <Row label="Password Reset Token TTL" value={`${process.env.NEXT_PUBLIC_AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES || "60"} minutes`} />
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Configure via AUTH_* environment variables.
          </p>
        </Section>

        <Section title="Session" icon={Clock}>
          <Row label="Session Idle Timeout" value={`${sessionTimeout} minutes`} />
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Configure via NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES.
          </p>
        </Section>

        <Section title="Email Configuration (SMTP)" icon={Mail}>
          <Row label="SMTP Host" configured={smtpHost} />
          <Row label="SMTP Port" value={process.env.NEXT_PUBLIC_SMTP_PORT || "587"} />
          <Row label="SMTP User" configured={smtpHost} />
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Configure via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables.
          </p>
        </Section>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Environment-based Configuration</p>
          <p className="text-xs text-amber-600">
            This system uses environment variables for configuration. All settings shown are read-only. Contact your system administrator to update these values in the <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
