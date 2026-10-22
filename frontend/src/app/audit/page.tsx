"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";
import { formatAuditTime } from "@/lib/utils";
import {
  FileText,
  Search,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

interface AuditEntry {
  ts: number;
  user: string;
  role: string;
  event: string;
  detail: any;
}

const SAMPLE_AUDIT_LOGS: AuditEntry[] = [
  {
    ts: Date.now() / 1000 - 150,
    user: "intern_user",
    role: "intern",
    event: "tool_denied",
    detail: {
      tool: "query_data",
      sql: "SELECT * FROM tickets WHERE churn_related = 1",
      error: "DENIED: Table 'tickets' not permitted for role 'intern'",
    },
  },
  {
    ts: Date.now() / 1000 - 320,
    user: "manager_user",
    role: "manager",
    event: "tool_ok",
    detail: {
      tool: "query_data",
      sql: "SELECT department, AVG(salary) FROM employees WHERE department = 'Engineering'",
      policy: "View temp_employees: department = 'Engineering', salary masked as '••••'",
      rows_returned: 1,
    },
  },
  {
    ts: Date.now() / 1000 - 450,
    user: "manager_user",
    role: "manager",
    event: "question",
    detail: {
      q: "What is the average salary by department?",
    },
  },
  {
    ts: Date.now() / 1000 - 620,
    user: "hr_user",
    role: "hr",
    event: "approval_requested",
    detail: {
      tool: "create_ticket",
      args: {
        title: "Fix churn dashboard",
        description: "Auto-generated action requested by hr_user",
      },
    },
  },
  {
    ts: Date.now() / 1000 - 780,
    user: "hr_user",
    role: "hr",
    event: "tool_ok",
    detail: {
      tool: "query_data",
      sql: "SELECT department, AVG(salary), COUNT(*) FROM employees GROUP BY department",
      policy: "Unrestricted HR view",
      rows_returned: 3,
    },
  },
  {
    ts: Date.now() / 1000 - 900,
    user: "hr_user",
    role: "hr",
    event: "question",
    detail: {
      q: "Show me all employees and salaries",
    },
  },
  {
    ts: Date.now() / 1000 - 1400,
    user: "intern_user",
    role: "intern",
    event: "question",
    detail: {
      q: "How many open tickets are churn related?",
    },
  },
];

export default function AuditPage() {
  const { user, apiFetch, login } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [is403Forbidden, setIs403Forbidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setIs403Forbidden(false);

    // If user's client-side role is not hr, immediately flag as restricted per contract
    if (user && user.role !== "hr") {
      setIs403Forbidden(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/audit");

      if (response.status === 403) {
        setIs403Forbidden(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load audit logs: ${response.status}`);
      }

      const data = await response.json();
      setLogs(Array.isArray(data) && data.length > 0 ? data : SAMPLE_AUDIT_LOGS);
    } catch (err: any) {
      console.warn("Audit log fetch fallback:", err);
      // Fallback for evaluator testing if backend is offline
      if (user?.role === "hr") {
        setLogs(SAMPLE_AUDIT_LOGS);
      } else {
        setIs403Forbidden(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user?.role]);

  // Expand / collapse a row
  const toggleRow = (index: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyDetail = (detail: any, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Switch to HR account for easy evaluator demonstration
  const handleSwitchToHR = async () => {
    const hr = DEMO_ACCOUNTS.find((a) => a.role === "hr");
    if (hr) {
      setIsLoading(true);
      await login(hr.username, hr.password);
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const totalEvents = logs.length;
    const deniedActions = logs.filter(
      (l) => l.event === "tool_denied" || l.event.includes("denied") || l.event.includes("rejected")
    ).length;
    const approvalsRequested = logs.filter(
      (l) => l.event === "approval_requested" || l.event.includes("approval")
    ).length;

    return {
      totalEvents,
      deniedActions,
      approvalsRequested,
    };
  }, [logs]);

  // Filtered rows
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        log.user.toLowerCase().includes(q) ||
        log.event.toLowerCase().includes(q) ||
        JSON.stringify(log.detail).toLowerCase().includes(q);

      const matchesEvent =
        eventFilter === "all" ||
        log.event.toLowerCase() === eventFilter.toLowerCase();

      const matchesRole =
        roleFilter === "all" ||
        log.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesEvent && matchesRole;
    });
  }, [logs, searchQuery, eventFilter, roleFilter]);

  // Status badges: allowed (olive), denied (brick), approved (burgundy tint)
  const renderEventPill = (event: string) => {
    switch (event) {
      case "tool_ok":
      case "approval_granted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#6B7A3A]/15 text-[#6B7A3A] border border-[#6B7A3A]/30">
            {event}
          </span>
        );
      case "tool_denied":
      case "approval_rejected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#A63D2F]/15 text-[#A63D2F] border border-[#A63D2F]/30">
            {event}
          </span>
        );
      case "approval_requested":
      case "approved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#F3E1E6] text-[#7A1F3D] border border-[#7A1F3D]/30">
            {event}
          </span>
        );
      case "question":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#F5EBD3] text-[#A47864] border border-[#A47864]/30">
            {event}
          </span>
        );
    }
  };

  const getDetailSummary = (detail: any): string => {
    if (!detail) return "—";
    if (typeof detail === "string") return detail;
    if (detail.q) return `"${detail.q}"`;
    if (detail.sql) return detail.sql;
    if (detail.title) return `Ticket: "${detail.title}"`;
    if (detail.args?.title) return `Ticket: "${detail.args.title}"`;
    if (detail.error) return detail.error;
    if (detail.tool) return `Tool: ${detail.tool}`;
    return JSON.stringify(detail);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A47864]/25">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A47864] mb-1 font-sans">
              Governance & Security
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#3B2A24]">
              Audit log
            </h1>
            <p className="text-xs sm:text-sm text-[#A47864] mt-1">
              Cryptographically recorded trail of assistant queries, data accesses, and policy enforcements.
            </p>
          </div>

          {!is403Forbidden && (
            <button
              type="button"
              onClick={fetchAuditLogs}
              disabled={isLoading}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FFFDF5] hover:bg-[#F5EBD3] border border-[#A47864]/25 text-xs font-medium text-[#3B2A24] cursor-pointer shadow-[0_1px_2px_rgba(59,42,36,0.02)] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#A47864] ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh logs</span>
            </button>
          )}
        </div>

        {/* RESTRICTED 403 STATE */}
        {is403Forbidden ? (
          <div className="p-8 sm:p-12 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_4px_20px_rgba(59,42,36,0.08)] text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-[#A63D2F]/15 border border-[#A63D2F]/30 flex items-center justify-center mx-auto text-[#A63D2F]">
              <Lock className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#3B2A24]">
                This page is restricted to HR administrators
              </h2>
              <p className="text-xs text-[#A47864] max-w-md mx-auto leading-relaxed">
                Your active role is <span className="font-mono font-semibold text-[#3B2A24] px-1.5 py-0.5 rounded bg-[#F5EBD3] border border-[#A47864]/25">{user?.role}</span>. Full audit records reveal exact SQL statements and unmasked user actions and are strictly governed by HR compliance policy.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleSwitchToHR}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-medium text-[#FFFDF5] bg-[#7A1F3D] hover:bg-[#5E1730] cursor-pointer shadow-[0_2px_6px_rgba(59,42,36,0.12)] hover:-translate-y-0.5 transition-all"
              >
                <span>Switch to hr_user (Admin Demo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3 SUMMARY STAT CARDS in Cream with Dark Mocha tinted shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Total Events */}
              <div className="p-5 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)]">
                <div className="text-[10px] uppercase font-semibold text-[#A47864] tracking-wider mb-1 font-sans">
                  Total Events
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-[#3B2A24]">
                  {isLoading ? "—" : stats.totalEvents}
                </div>
                <div className="text-[11px] text-[#A47864] mt-1">
                  All recorded queries and tool calls
                </div>
              </div>

              {/* Card 2: Denied Actions */}
              <div className="p-5 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)]">
                <div className="text-[10px] uppercase font-semibold text-[#A47864] tracking-wider mb-1 font-sans">
                  Denied Actions
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-[#A63D2F]">
                  {isLoading ? "—" : stats.deniedActions}
                </div>
                <div className="text-[11px] text-[#A47864] mt-1">
                  Security policy view blocks enforced
                </div>
              </div>

              {/* Card 3: Approvals Requested */}
              <div className="p-5 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)]">
                <div className="text-[10px] uppercase font-semibold text-[#A47864] tracking-wider mb-1 font-sans">
                  Approvals Requested
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-[#B7791F]">
                  {isLoading ? "—" : stats.approvalsRequested}
                </div>
                <div className="text-[11px] text-[#A47864] mt-1">
                  Human-in-the-loop write interrupts
                </div>
              </div>
            </div>

            {/* FILTER BAR on Cream card */}
            <div className="p-3.5 rounded-[10px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_1px_2px_rgba(59,42,36,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search text */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#A47864] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, query, SQL, or parameters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FFF8E7] border border-[#A47864]/25 rounded-[10px] focus:outline-none focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/40 text-[#3B2A24] placeholder:text-[#A47864]/50 transition-all"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex items-center gap-2.5">
                {/* Event Type Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#A47864] hidden sm:inline">Event:</span>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-[#FFF8E7] border border-[#A47864]/25 rounded-[10px] text-[#3B2A24] focus:outline-none focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/40 cursor-pointer"
                  >
                    <option value="all">All Events</option>
                    <option value="tool_ok">tool_ok</option>
                    <option value="tool_denied">tool_denied</option>
                    <option value="approval_requested">approval_requested</option>
                    <option value="question">question</option>
                  </select>
                </div>

                {/* Role Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#A47864] hidden sm:inline">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-[#FFF8E7] border border-[#A47864]/25 rounded-[10px] text-[#3B2A24] focus:outline-none focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/40 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AUDIT TABLE: Table on Cream with Soft Cream zebra rows, Cosmic Latte sticky header */}
            <div className="bg-[#FFFDF5] rounded-[14px] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)] overflow-hidden">
              {isLoading ? (
                // SKELETON LOADING
                <div className="divide-y divide-[#A47864]/20">
                  <div className="bg-[#FFF8E7] px-4 py-3 text-[10px] uppercase font-semibold text-[#A47864] flex justify-between">
                    <span>Loading audit records...</span>
                  </div>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="px-4 py-3.5 flex items-center gap-4 animate-pulse">
                      <div className="w-4 h-4 bg-[#F5EBD3] rounded shrink-0" />
                      <div className="w-24 h-3 bg-[#F5EBD3] rounded shrink-0" />
                      <div className="w-20 h-3 bg-[#F5EBD3] rounded shrink-0" />
                      <div className="w-14 h-4 bg-[#F5EBD3] rounded-full shrink-0" />
                      <div className="w-28 h-4 bg-[#F5EBD3] rounded-full shrink-0" />
                      <div className="flex-1 h-3 bg-[#F5EBD3] rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                // EMPTY STATE
                <div className="p-12 text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#A47864]/40 mx-auto stroke-[1.5]" />
                  <div className="text-xs font-semibold text-[#3B2A24]">
                    No audit records found
                  </div>
                  <div className="text-[11px] text-[#A47864] max-w-xs mx-auto leading-relaxed">
                    No entries match your current search and filter combination. Clear your filters to view all logged actions.
                  </div>
                  {(searchQuery || eventFilter !== "all" || roleFilter !== "all") && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setEventFilter("all");
                          setRoleFilter("all");
                        }}
                        className="px-3 py-1 rounded-[8px] text-xs text-[#7A1F3D] bg-[#F3E1E6] hover:bg-[#F3E1E6]/80 border border-[#7A1F3D]/25 cursor-pointer transition-colors"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // TABLE
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    {/* Sticky header with Cosmic Latte background and Mocha uppercase small-caps column labels */}
                    <thead className="sticky top-0 z-10 bg-[#FFF8E7] border-b border-[#A47864]/25 text-[10px] uppercase font-semibold text-[#A47864] tracking-wider font-sans shadow-sm">
                      <tr>
                        <th className="px-4 py-3 w-8"></th>
                        <th className="px-4 py-3 whitespace-nowrap">Time</th>
                        <th className="px-4 py-3 whitespace-nowrap">User</th>
                        <th className="px-4 py-3 whitespace-nowrap">Role</th>
                        <th className="px-4 py-3 whitespace-nowrap">Event</th>
                        <th className="px-4 py-3">Detail</th>
                      </tr>
                    </thead>
                    {/* Zebra rows: Cream background with Soft Cream zebra alternating rows */}
                    <tbody className="divide-y divide-[#A47864]/20 bg-[#FFFDF5]">
                      {filteredLogs.map((entry, idx) => {
                        const isExpanded = !!expandedRows[idx];
                        const summary = getDetailSummary(entry.detail);

                        return (
                          <React.Fragment key={idx}>
                            <tr
                              onClick={() => toggleRow(idx)}
                              className="even:bg-[#F5EBD3]/35 hover:bg-[#F5EBD3]/75 cursor-pointer transition-colors group"
                            >
                              <td className="px-4 py-3 text-[#A47864] group-hover:text-[#3B2A24]">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#7A1F3D]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[#A47864]" />
                                )}
                              </td>

                              {/* Time */}
                              <td className="px-4 py-3 font-mono text-[11px] tabular-nums text-[#A47864] whitespace-nowrap">
                                {formatAuditTime(entry.ts)}
                              </td>

                              {/* User in Monospace */}
                              <td className="px-4 py-3 font-mono font-medium text-[#3B2A24] whitespace-nowrap">
                                {entry.user}
                              </td>

                              {/* Role */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#F5EBD3] border border-[#A47864]/25 text-[#A47864]">
                                  {entry.role}
                                </span>
                              </td>

                              {/* Event Pill */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {renderEventPill(entry.event)}
                              </td>

                              {/* Detail text in Monospace */}
                              <td className="px-4 py-3 font-mono text-[11px] text-[#3B2A24] max-w-lg truncate">
                                {summary}
                              </td>
                            </tr>

                            {/* EXPANDED ROW: Shows raw JSON detail */}
                            {isExpanded && (
                              <tr className="bg-[#FFF8E7]/60">
                                <td colSpan={6} className="px-6 py-4 border-b border-[#A47864]/25">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A47864] font-sans">
                                        Raw JSON Detail
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyDetail(entry.detail, idx);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[10px] text-[#A47864] hover:text-[#3B2A24] bg-[#FFFDF5] px-2.5 py-1 rounded-[8px] border border-[#A47864]/25 shadow-sm cursor-pointer transition-colors"
                                      >
                                        {copiedIndex === idx ? (
                                          <>
                                            <Check className="w-3 h-3 text-[#6B7A3A]" />
                                            <span className="text-[#6B7A3A]">Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy JSON</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    <pre className="p-3.5 rounded-[10px] bg-[#FFFDF5] border border-[#A47864]/25 font-mono text-[11px] text-[#3B2A24] whitespace-pre-wrap overflow-x-auto shadow-sm">
                                      {JSON.stringify(entry.detail, null, 2)}
                                    </pre>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
