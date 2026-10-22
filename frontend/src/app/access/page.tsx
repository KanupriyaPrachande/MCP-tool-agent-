"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  Minus,
  Shield,
  EyeOff,
  Database,
  Server,
  Lock,
} from "lucide-react";

interface MatrixRow {
  role: "hr" | "manager" | "intern";
  roleName: string;
  roleBadge: string;
  roleDescription: string;
  tools: {
    list_tables: boolean;
    query_data: boolean;
    create_ticket: boolean;
  };
  data: {
    employees: {
      allowed: boolean;
      masked: boolean;
      note: string;
    };
    tickets: {
      allowed: boolean;
      masked: boolean;
      note: string;
    };
  };
}

const ACCESS_MATRIX: MatrixRow[] = [
  {
    role: "hr",
    roleName: "Human Resources",
    roleBadge: "Full Admin",
    roleDescription: "Unrestricted enterprise data access and audit trail governance.",
    tools: {
      list_tables: true,
      query_data: true,
      create_ticket: true,
    },
    data: {
      employees: {
        allowed: true,
        masked: false,
        note: "All rows, all columns unmasked",
      },
      tickets: {
        allowed: true,
        masked: false,
        note: "All rows unmasked",
      },
    },
  },
  {
    role: "manager",
    roleName: "Engineering Manager",
    roleBadge: "Scoped Access",
    roleDescription: "Operational department visibility with automatic salary masking.",
    tools: {
      list_tables: true,
      query_data: true,
      create_ticket: true,
    },
    data: {
      employees: {
        allowed: true,
        masked: true,
        note: "Engineering rows only, salary masked (••••)",
      },
      tickets: {
        allowed: true,
        masked: false,
        note: "All rows",
      },
    },
  },
  {
    role: "intern",
    roleName: "Engineering Intern",
    roleBadge: "Zero-Trust Masked",
    roleDescription: "Strictly limited read access with PII masking and ticket restriction.",
    tools: {
      list_tables: true,
      query_data: true,
      create_ticket: false,
    },
    data: {
      employees: {
        allowed: true,
        masked: true,
        note: "Engineering rows only, salary and email masked (••••)",
      },
      tickets: {
        allowed: false,
        masked: false,
        note: "No access (Restricted)",
      },
    },
  },
];

export default function AccessPage() {
  const { user } = useAuth();
  const activeRole = user?.role || "intern";

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto transition-opacity duration-150 animate-in fade-in">
        {/* Page Header */}
        <div className="pb-4 border-b border-[#A47864]/25">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A47864] mb-1 font-sans">
            Access Governance
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#3B2A24]">
            Access Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#A47864] mt-1.5 font-medium">
            Permissions are enforced on the server, not in the prompt.
          </p>
        </div>

        {/* Small Legend at the top */}
        <div className="flex flex-wrap items-center gap-5 p-3.5 rounded-[10px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_1px_2px_rgba(59,42,36,0.02)] text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A47864] font-sans">
            Policy Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D] inline-flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[#3B2A24] font-medium text-[11px]">Allowed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#B7791F]/15 border border-[#B7791F]/30 text-[#B7791F] inline-flex items-center justify-center">
              <EyeOff className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[#3B2A24] font-medium text-[11px]">Masked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#F5EBD3] border border-[#A47864]/30 text-[#A47864] inline-flex items-center justify-center">
              <Minus className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[#3B2A24] font-medium text-[11px]">Denied</span>
          </div>
        </div>

        {/* Active Role Indicator */}
        <div className="p-4 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#7A1F3D]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#3B2A24] flex items-center gap-2">
                <span>Active Signed-In Role:</span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#7A1F3D] text-[#FFFDF5] font-semibold">
                  {activeRole}
                </span>
                <span className="text-[#A47864] font-normal font-sans">
                  ({user?.username})
                </span>
              </div>
              <div className="text-[11px] text-[#A47864] mt-0.5">
                The row corresponding to your current role is highlighted below.
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#A47864] flex items-center gap-1.5 font-mono">
            <Server className="w-3.5 h-3.5 text-[#7A1F3D]" />
            <span>SQLite authorizer callback active</span>
          </div>
        </div>

        {/* ACCESS MATRIX TABLE - Clean grid on Cream */}
        <div className="bg-[#FFFDF5] rounded-[14px] border border-[#A47864]/25 shadow-[0_2px_8px_rgba(59,42,36,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px] border-collapse">
              {/* Table Group Headers */}
              <thead>
                <tr className="bg-[#FFF8E7] border-b border-[#A47864]/25">
                  <th
                    rowSpan={2}
                    className="px-4 py-3 text-[11px] font-serif font-semibold text-[#3B2A24] border-r border-[#A47864]/25 w-52"
                  >
                    Role
                  </th>
                  <th
                    colSpan={3}
                    className="px-4 py-2 text-center text-[10px] uppercase font-semibold text-[#7A1F3D] border-r border-[#A47864]/25 bg-[#F3E1E6]/40 font-mono tracking-wider"
                  >
                    Tools
                  </th>
                  <th
                    colSpan={2}
                    className="px-4 py-2 text-center text-[10px] uppercase font-semibold text-[#3B2A24] bg-[#F5EBD3]/60 font-mono tracking-wider"
                  >
                    Data Views
                  </th>
                </tr>
                {/* Sub-column Headers */}
                <tr className="bg-[#FFF8E7] border-b border-[#A47864]/25 text-[10px] font-mono text-[#A47864]">
                  <th className="px-3 py-2 text-center font-medium border-r border-[#A47864]/20">
                    list_tables
                  </th>
                  <th className="px-3 py-2 text-center font-medium border-r border-[#A47864]/20">
                    query_data
                  </th>
                  <th className="px-3 py-2 text-center font-medium border-r border-[#A47864]/25">
                    create_ticket
                  </th>
                  <th className="px-4 py-2 font-medium border-r border-[#A47864]/20">
                    employees
                  </th>
                  <th className="px-4 py-2 font-medium">
                    tickets
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#A47864]/20 bg-[#FFFDF5]">
                {ACCESS_MATRIX.map((row) => {
                  const isCurrent = row.role === activeRole;

                  return (
                    <tr
                      key={row.role}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-[#F3E1E6]/30 font-medium"
                          : "hover:bg-[#F5EBD3]/40"
                      }`}
                    >
                      {/* Role Header in Playfair Display */}
                      <td className="px-4 py-4 border-r border-[#A47864]/25 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-semibold text-[#3B2A24]">
                            {row.roleName}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] uppercase font-semibold bg-[#7A1F3D] text-[#FFFDF5] font-mono">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#A47864] font-mono mt-0.5">
                          {row.role} · {row.roleBadge}
                        </div>
                      </td>

                      {/* Tool: list_tables (Allowed: Burgundy Tint with Burgundy Check) */}
                      <td className="px-3 py-4 text-center border-r border-[#A47864]/20 align-middle">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D]">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </td>

                      {/* Tool: query_data (Allowed: Burgundy Tint with Burgundy Check) */}
                      <td className="px-3 py-4 text-center border-r border-[#A47864]/20 align-middle">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D]">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </td>

                      {/* Tool: create_ticket */}
                      <td className="px-3 py-4 text-center border-r border-[#A47864]/25 align-middle">
                        {row.tools.create_ticket ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D]">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F5EBD3] border border-[#A47864]/30 text-[#A47864]" title="Denied">
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </td>

                      {/* Data: employees */}
                      <td className="px-4 py-4 border-r border-[#A47864]/20 align-top">
                        <div className="flex items-start gap-2.5">
                          {row.data.employees.masked ? (
                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#B7791F]/15 border border-[#B7791F]/30 text-[#B7791F] shrink-0 mt-0.5" title="Masked">
                              <EyeOff className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D] shrink-0 mt-0.5" title="Allowed">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                          <div className="text-[11px] leading-relaxed text-[#3B2A24]">
                            {row.data.employees.note}
                          </div>
                        </div>
                      </td>

                      {/* Data: tickets */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          {row.data.tickets.allowed ? (
                            <>
                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F3E1E6] border border-[#7A1F3D]/25 text-[#7A1F3D] shrink-0 mt-0.5" title="Allowed">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <div className="text-[11px] leading-relaxed text-[#3B2A24]">
                                {row.data.tickets.note}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F5EBD3] border border-[#A47864]/30 text-[#A47864] shrink-0 mt-0.5" title="Denied">
                                <Lock className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <div className="text-[11px] leading-relaxed text-[#A63D2F] font-medium">
                                {row.data.tickets.note}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Architecture Footnote on Cream card */}
        <div className="p-5 rounded-[14px] bg-[#FFFDF5] border border-[#A47864]/25 space-y-2 text-xs text-[#A47864] leading-relaxed shadow-[0_2px_8px_rgba(59,42,36,0.03)]">
          <div className="flex items-center gap-2 font-medium text-[#3B2A24]">
            <Database className="w-4 h-4 text-[#7A1F3D]" />
            <span className="font-serif text-sm">Server-Side Isolation Guarantee</span>
          </div>
          <p>
            When a user executes a query in Sentinel, the backend creates a temporary SQLite view for each permitted table (e.g., <code className="px-1.5 py-0.5 rounded bg-[#F5EBD3] border border-[#A47864]/25 font-mono text-[10px] text-[#3B2A24]">CREATE TEMP VIEW employees AS SELECT id, name, department, &apos;••••&apos; AS salary FROM raw_employees WHERE department = &apos;Engineering&apos;</code>).
            A native SQLite authorizer callback denies direct access to <code className="px-1.5 py-0.5 rounded bg-[#F5EBD3] border border-[#A47864]/25 font-mono text-[10px] text-[#3B2A24]">raw_*</code> tables. The model cannot bypass these rules through prompt injection because security constraints are enforced directly at the SQL engine level.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
