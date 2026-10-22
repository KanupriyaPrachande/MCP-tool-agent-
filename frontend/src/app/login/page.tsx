"use client";

import React, { useState } from "react";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";
import { ArrowRight, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(username.trim(), password.trim());
    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed.");
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setActiveAccount(account.username);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#FFF8E7] text-[#3B2A24]">
      {/* Left side: Cosmic Latte background with wordmark, tagline, Cream form card, and demo chips */}
      <div className="w-full md:w-[54%] flex flex-col justify-between px-6 sm:px-12 md:px-14 lg:px-20 py-10 lg:py-14 max-w-2xl mx-auto md:mx-0 order-1">
        <div>
          {/* Mobile wordmark indicator */}
          <div className="md:hidden mb-8 pb-4 border-b border-[#A47864]/25">
            <span className="font-serif text-2xl tracking-tight text-[#3B2A24] font-medium">
              Sentinel
            </span>
            <span className="ml-2 text-xs uppercase tracking-widest text-[#A47864] font-medium font-sans">
              Enterprise Access
            </span>
          </div>

          <div className="mb-6">
            <span className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#3B2A24]">
              Sentinel
            </span>
            <p className="text-sm text-[#A47864] leading-relaxed mt-1">
              Ask your company data. Only see what your role allows.
            </p>
          </div>

          {/* Form container: Cream card with subtle shadow and Mocha hairline border */}
          <div className="bg-[#FFFDF5] border border-[#A47864]/25 rounded-[14px] p-6 sm:p-7 shadow-[0_4px_20px_rgba(59,42,36,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="mb-5">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#A47864]">
                Authentication
              </span>
              <h1 className="font-serif text-2xl font-normal text-[#3B2A24] tracking-tight mt-0.5">
                Sign in to Sentinel
              </h1>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-[10px] bg-[#A63D2F]/10 border border-[#A63D2F]/30 flex items-start gap-2.5 text-xs text-[#A63D2F]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-[#3B2A24] mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. hr_user"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF5] border border-[#A47864]/25 rounded-[10px] shadow-[0_1px_2px_rgba(59,42,36,0.03)] placeholder:text-[#A47864]/50 text-[#3B2A24] focus:outline-none focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/40 transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-[#3B2A24]"
                  >
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF5] border border-[#A47864]/25 rounded-[10px] shadow-[0_1px_2px_rgba(59,42,36,0.03)] placeholder:text-[#A47864]/50 text-[#3B2A24] focus:outline-none focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/40 transition-all"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#FFFDF5] bg-[#7A1F3D] hover:bg-[#5E1730] active:bg-[#5E1730] rounded-[10px] shadow-[0_2px_6px_rgba(59,42,36,0.12)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#FFFDF5]/30 border-t-[#FFFDF5] rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo Accounts Section with Quick-Fill Chips */}
          <div className="mt-8 pt-6 border-t border-[#A47864]/25">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#A47864]">
                Demo Personas & Quick-Fill
              </span>
              <span className="text-[10px] text-[#A47864]/80">
                Click chip to autofill
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected =
                  activeAccount === acc.username ||
                  (username === acc.username && password === acc.password);

                const getRoleBadge = (role: string) => {
                  switch (role) {
                    case "hr":
                      return "bg-[#6B7A3A]/15 text-[#6B7A3A] border border-[#6B7A3A]/30";
                    case "manager":
                      return "bg-[#B7791F]/15 text-[#B7791F] border border-[#B7791F]/30";
                    case "intern":
                    default:
                      return "bg-[#F5EBD3] text-[#A47864] border border-[#A47864]/30";
                  }
                };

                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`w-full text-left p-3 rounded-[10px] border text-xs transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#F3E1E6]/40 border-[#7A1F3D] shadow-[0_2px_8px_rgba(122,31,61,0.10)]"
                        : "bg-[#FFFDF5] hover:bg-[#F5EBD3] border-[#A47864]/25 shadow-[0_1px_2px_rgba(59,42,36,0.02)]"
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium text-[#3B2A24] text-[13px]">
                          {acc.username}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${getRoleBadge(
                            acc.role
                          )}`}
                        >
                          {acc.role}
                        </span>
                      </div>
                      <div className="text-[#A47864] text-[11px] line-clamp-1">
                        {acc.label} · password:{" "}
                        <span className="font-mono text-[#3B2A24] font-medium">{acc.password}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-[#A47864] group-hover:text-[#7A1F3D]">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#7A1F3D]" />
                      ) : (
                        <span className="text-[11px] font-medium text-[#A47864] group-hover:text-[#7A1F3D] transition-colors">
                          Fill →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-[#A47864]/20 text-[11px] text-[#A47864] flex items-center justify-between font-mono">
          <span>Sentinel v1.0 · Data Governance</span>
          <span>Zero-Trust Architecture</span>
        </div>
      </div>

      {/* Right side: Burgundy brand panel with gradient and faint geometric lattice pattern */}
      <div className="w-full md:w-[46%] relative bg-[#7A1F3D] px-6 sm:px-10 md:px-12 py-8 md:py-10 flex flex-col order-2 overflow-hidden shadow-2xl">
        {/* Soft radial gradient layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#7A1F3D_0%,_#5E1730_100%)] pointer-events-none" />

        {/* Faint geometric lattice pattern overlay at ~6% opacity */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16 L16 0 L32 16 L16 32 Z' fill='none' stroke='%23FFFDF5' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header row: Wordmark in Playfair Display + CONFIDENTIAL badge */}
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl md:text-3xl tracking-tight text-[#FFFDF5] font-medium">
              Sentinel
            </span>
            <span className="text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full border border-[#FFFDF5]/30 text-[#FFFDF5] font-medium font-mono">
              CONFIDENTIAL
            </span>
          </div>

          {/* Content block: generous whitespace, elegant editorial layout */}
          <div className="hidden md:flex flex-col mt-12 max-w-md space-y-6">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#F3E1E6]">
                COMPANY DATA GOVERNANCE
              </span>

              <h2 className="font-serif text-[28px] lg:text-[32px] text-[#FFFDF5] tracking-tight leading-tight mt-1.5 mb-3 font-normal">
                Direct access to company data, governed by strict per-role policies.
              </h2>

              <p className="text-sm text-[#F5EBD3]/90 leading-relaxed">
                Employees ask questions about corporate records in natural language. Sentinel routes queries through controlled MCP tools, automatically enforcing table allowances, column-level masking, row filters, and audit trail generation.
              </p>
            </div>

            {/* Static "same question, two answers" card restyled in Cream with Mocha accents */}
            <div className="bg-[#FFFDF5] rounded-[14px] border border-[#A47864]/25 overflow-hidden text-[#3B2A24] shadow-[0_8px_24px_rgba(59,42,36,0.15)]">
              {/* Header strip in Soft Cream with Dark Mocha font-mono */}
              <div className="bg-[#F5EBD3] px-3.5 py-2 font-mono text-[11px] text-[#3B2A24] tracking-tight border-b border-[#A47864]/20 flex items-center justify-between">
                <span>SELECT name, salary FROM employees</span>
                <span className="text-[10px] text-[#A47864] font-sans">Role comparison</span>
              </div>

              {/* Two rows below: HR (real values) vs Intern (masked values) */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3E1E6] text-[#7A1F3D] border border-[#7A1F3D]/25 tracking-wide">
                      HR
                    </span>
                    <span className="text-[#3B2A24]">Priya Nair</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A47864]/40">|</span>
                    <span className="font-semibold text-[#3B2A24] tabular-nums">
                      $84,000
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-xs pt-1.5 border-t border-[#A47864]/15">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EBD3] text-[#A47864] border border-[#A47864]/30 tracking-wide">
                      INTERN
                    </span>
                    <span className="text-[#3B2A24]">Priya Nair</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A47864]/40">|</span>
                    <span className="font-bold text-[#A47864] bg-[#F5EBD3] px-2 py-0.5 rounded border border-[#A47864]/25">
                      ••••
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thin divider + Feature rows with outlined line icons */}
            <div className="pt-4 border-t border-[#FFFDF5]/20 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-[8px] border border-[#FFFDF5]/30 bg-[#FFFDF5]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-[#FFFDF5]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#FFFDF5]">
                    Zero-bypass policy layer
                  </div>
                  <div className="text-[11px] text-[#F5EBD3]/80 leading-relaxed mt-0.5">
                    The model never receives elevated tokens. Roles are injected at the tool execution boundary.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-[8px] border border-[#FFFDF5]/30 bg-[#FFFDF5]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFFDF5]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#FFFDF5]">
                    Human-in-the-loop write approval
                  </div>
                  <div className="text-[11px] text-[#F5EBD3]/80 leading-relaxed mt-0.5">
                    Sensitive actions like ticket creation interrupt execution until explicitly approved.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#F5EBD3]/60 pt-6 mt-6 border-t border-[#FFFDF5]/15 font-mono">
            Governed MCP Server Architecture
          </div>
        </div>
      </div>
    </div>
  );
}
