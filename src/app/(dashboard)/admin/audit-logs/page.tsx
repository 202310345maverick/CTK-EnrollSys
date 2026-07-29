"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AuditLog = {
  _id: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  userId: {
    _id: string;
    email: string;
    profile?: { firstName: string; lastName: string };
  } | null;
};

type Pagination = { page: number; pages: number; total: number; limit: number };

const ACTION_VARIANTS: Record<string, string> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  LOGIN: "neutral",
  LOGOUT: "neutral",
  APPROVE: "success",
  REJECT: "danger",
  VERIFY: "info",
  VOID: "danger",
  UPLOAD: "info",
  DOWNLOAD: "info",
  VIEW: "neutral",
};

const ACTIONS = ["CREATE","UPDATE","DELETE","LOGIN","LOGOUT","APPROVE","REJECT","VERIFY","VOID","UPLOAD","DOWNLOAD","VIEW"];
const RESOURCES = ["USER","STUDENT","ENROLLMENT","PAYMENT","DOCUMENT","SCHOOL_YEAR","FEE_STRUCTURE","AUTH"];

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const inputCls = "h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary";
const selectCls = "h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary bg-white";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resource", resourceFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 50 });
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filteredLogs = search
    ? logs.filter((l) => {
        const name = l.userId?.profile
          ? `${l.userId.profile.firstName} ${l.userId.profile.lastName}`.toLowerCase()
          : "";
        const email = l.userId?.email?.toLowerCase() || "";
        const s = search.toLowerCase();
        return name.includes(s) || email.includes(s);
      })
    : logs;

  const getUserDisplay = (log: AuditLog) => {
    if (!log.userId) return "System";
    const p = log.userId.profile;
    if (p) return `${p.firstName} ${p.lastName}`;
    return log.userId.email || "Unknown";
  };

  const getDetailsSummary = (log: AuditLog) => {
    try {
      const d = log.details;
      if (!d || typeof d !== "object") return "—";
      const keys = Object.keys(d);
      if (keys.length === 0) return "—";
      const val = d[keys[0]];
      return `${keys[0]}: ${typeof val === "string" ? val.slice(0, 40) : JSON.stringify(val).slice(0, 40)}`;
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-xs text-slate-500">Track all system activity and changes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputCls + " w-full pl-8"}
              />
            </div>
            <FormSelect
              value={actionFilter}
              onChange={(v) => { setActionFilter(v); setPage(1); }}
              placeholder="All Actions"
              options={ACTIONS.map((a) => ({ value: a, label: a }))}
              className="w-36"
            />
            <FormSelect
              value={resourceFilter}
              onChange={(v) => { setResourceFilter(v); setPage(1); }}
              placeholder="All Resources"
              options={RESOURCES.map((r) => ({ value: r, label: r }))}
              className="w-40"
            />
            <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder="From date" minYear={2020} maxYear={2035} className="w-36" />
            <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder="To date" minYear={2020} maxYear={2035} className="w-36" />
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => { setSearch(""); setActionFilter(""); setResourceFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-primary" />
            {pagination.total} Log Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No audit logs found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Resource</TableHead>
                      <TableHead className="text-xs">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(log.createdAt)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{getUserDisplay(log)}</p>
                            {log.userId?.email && <p className="text-xs text-muted-foreground">{log.userId.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(ACTION_VARIANTS[log.action] || "neutral") as any}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.resource.replace("_", " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{getDetailsSummary(log)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
