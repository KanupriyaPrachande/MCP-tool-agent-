"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";
import {
  Terminal,
  Shield,
  FileText,
  LogOut,
  Search,
  CheckCircle2,
  ChevronDown,
  Database,
  Lock,
  Menu,
  X,
  RotateCcw,
  User,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

interface CommandItem {
  id: string;
  category: "Navigation" | "Actions" | "Switch Persona";
  label: string;
  sublabel?: string;
  shortcut?: string;
  action: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout, isLoading, login } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cmdInputRef = useRef<HTMLInputElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => {
          if (!prev) {
            setCmdSearch("");
            setSelectedIndex(0);
          }
          return !prev;
        });
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setRoleMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 50);
    }
  }, [cmdOpen]);

  const navItems = [
    {
      name: "Workspace",
      href: "/workspace",
      icon: Terminal,
      description: "Ask about company data",
    },
    {
      name: "Audit log",
      href: "/audit",
      icon: FileText,
      description: "Access and query verification",
      badge: user?.role === "hr" ? undefined : "HR Only",
    },
    {
      name: "Access",
      href: "/access",
      icon: Shield,
      description: "Role policies and masking rules",
    },
  ];

  const handleQuickSwitchRole = async (targetUsername: string) => {
    const target = DEMO_ACCOUNTS.find((a) => a.username === targetUsername);
    if (!target) return;
    setRoleMenuOpen(false);
    setCmdOpen(false);
    setMobileMenuOpen(false);
    await login(target.username, target.password);
  };

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case "hr":
        return "bg-[#6B7A3A]/15 text-[#6B7A3A] border-[#6B7A3A]/30";
      case "manager":
        return "bg-[#B7791F]/15 text-[#B7791F] border-[#B7791F]/30";
      case "intern":
      default:
        return "bg-[#F5EBD3] text-[#A47864] border-[#A47864]/30";
    }
  };

  // Commands for Ctrl+K
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-workspace",
      category: "Navigation",
      label: "Go to Workspace",
      sublabel: "Ask about company data",
      shortcut: "G W",
      icon: Terminal,
      action: () => {
        router.push("/workspace");
        setCmdOpen(false);
      },
    },
    {
      id: "nav-audit",
      category: "Navigation",
      label: "Go to Audit log",
      sublabel: "Access verification records",
      shortcut: "G A",
      icon: FileText,
      action: () => {
        router.push("/audit");
        setCmdOpen(false);
      },
    },
    {
      id: "nav-access",
      category: "Navigation",
      label: "Go to Access matrix",
      sublabel: "Permissions and masking rules",
      shortcut: "G M",
      icon: Shield,
      action: () => {
        router.push("/access");
        setCmdOpen(false);
      },
    },
    // Actions
    {
      id: "act-new-convo",
      category: "Actions",
      label: "New conversation",
      sublabel: "Clear session and start fresh question",
      shortcut: "Ctrl+N",
      icon: RotateCcw,
      action: () => {
        if (pathname === "/workspace") {
          window.location.href = "/workspace";
        } else {
          router.push("/workspace");
        }
        setCmdOpen(false);
      },
    },
    {
      id: "act-signout",
      category: "Actions",
      label: "Sign out",
      sublabel: "End current authenticated session",
      shortcut: "Shift+Q",
      icon: LogOut,
      action: () => {
        setCmdOpen(false);
        logout();
      },
    },
    // Personas
    ...DEMO_ACCOUNTS.map((acc) => ({
      id: `persona-${acc.username}`,
      category: "Switch Persona" as const,
      label: `Switch to ${acc.username}`,
      sublabel: `${acc.label} (${acc.role.toUpperCase()})`,
      shortcut: acc.role,
      icon: User,
      action: () => handleQuickSwitchRole(acc.username),
    })),
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = cmdSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.sublabel && cmd.sublabel.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? (filteredCommands.length || 1) - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#7A1F3D]/25 border-t-[#7A1F3D] rounded-full animate-spin" />
          <span className="text-xs text-[#A47864] font-medium tracking-wide">
            Loading Sentinel session...
          </span>
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#FFF8E7] text-[#3B2A24] selection:bg-[#F3E1E6] selection:text-[#7A1F3D]">
      {/* DESKTOP SIDEBAR - Cream background with Mocha hairline border */}
      <aside className="w-64 shrink-0 bg-[#FFFDF5] border-r border-[#A47864]/25 flex-col justify-between hidden md:flex">
        <div>
          {/* Logo / Wordmark in Playfair Display */}
          <div className="h-14 px-5 border-b border-[#A47864]/25 flex items-center justify-between">
            <Link href="/workspace" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-medium tracking-tight text-[#3B2A24]">
                Sentinel
              </span>
            </Link>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#6B7A3A]/15 border border-[#6B7A3A]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7A3A]" />
              <span className="text-[10px] font-medium text-[#6B7A3A] uppercase tracking-wider font-mono">
                Live
              </span>
            </div>
          </div>

          {/* Section label */}
          <div className="px-5 pt-6 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A47864]">
              Platform
            </span>
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-[#F3E1E6] text-[#7A1F3D] font-semibold shadow-[0_1px_3px_rgba(122,31,61,0.08)]"
                      : "text-[#3B2A24] hover:bg-[#F5EBD3]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-[#7A1F3D]"
                          : "text-[#A47864] group-hover:text-[#3B2A24]"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5EBD3] text-[#A47864] border border-[#A47864]/25 font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Server Enforcement Info Block */}
          <div className="mx-4 mt-8 p-3.5 rounded-[14px] bg-[#F5EBD3]/60 border border-[#A47864]/25">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#3B2A24] mb-1">
              <Database className="w-3.5 h-3.5 text-[#7A1F3D]" />
              <span>Governed SQLite Views</span>
            </div>
            <p className="text-[11px] text-[#A47864] leading-relaxed">
              Row filters and column masking enforce per-role isolation at execution time.
            </p>
          </div>
        </div>

        {/* Bottom meta */}
        <div className="p-4 border-t border-[#A47864]/25 text-[11px] text-[#A47864] flex items-center justify-between">
          <span className="font-mono text-[10px]">v1.0-prod</span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#3B2A24]">
            <Lock className="w-3 h-3 text-[#7A1F3D]" />
            RBAC Active
          </span>
        </div>
      </aside>

      {/* TABLET / MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Dark Mocha 35% overlay with backdrop blur */}
          <div
            className="fixed inset-0 bg-[#3B2A24]/35 backdrop-blur-[2px] transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer: Cream panel with Mocha hairline border */}
          <aside className="relative w-72 max-w-[80%] bg-[#FFFDF5] h-full flex flex-col justify-between shadow-[0_8px_30px_rgba(59,42,36,0.15)] z-50 p-5 border-r border-[#A47864]/25 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#A47864]/25">
                <span className="font-serif text-2xl font-medium tracking-tight text-[#3B2A24]">
                  Sentinel
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-[8px] text-[#A47864] hover:bg-[#F5EBD3] hover:text-[#3B2A24] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-5 pb-2 text-[10px] uppercase font-semibold text-[#A47864] tracking-wider">
                Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#F3E1E6] text-[#7A1F3D] font-semibold"
                          : "text-[#3B2A24] hover:bg-[#F5EBD3]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5EBD3] text-[#A47864] border border-[#A47864]/25 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-6 pb-2 text-[10px] uppercase font-semibold text-[#A47864] tracking-wider">
                Switch Role
              </div>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickSwitchRole(acc.username)}
                    className="w-full text-left px-3 py-2 rounded-[10px] text-xs hover:bg-[#F5EBD3] flex items-center justify-between cursor-pointer border border-transparent hover:border-[#A47864]/25 transition-all"
                  >
                    <span className="font-mono text-[11px] text-[#3B2A24]">
                      {acc.username}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-medium border ${getRoleBadgeClasses(
                        acc.role
                      )}`}
                    >
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#A47864]/25 flex items-center justify-between">
              <span className="text-xs text-[#A47864] font-mono">{user?.username}</span>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-[#A63D2F] hover:bg-[#A63D2F]/10 px-2 py-1 rounded-[8px] font-medium transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR - Cream background with Mocha hairline border */}
        <header className="h-14 bg-[#FFFDF5] border-b border-[#A47864]/25 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Mobile/Tablet Hamburger + Search Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-[8px] text-[#A47864] hover:bg-[#F5EBD3] hover:text-[#3B2A24] cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#FFF8E7] border border-[#A47864]/25 hover:border-[#A47864]/40 hover:bg-[#F5EBD3] text-xs text-[#A47864] hover:text-[#3B2A24] cursor-pointer transition-all shadow-[0_1px_2px_rgba(59,42,36,0.03)]"
            >
              <Search className="w-3.5 h-3.5 text-[#A47864]" />
              <span className="hidden sm:inline">Commands & navigation...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-[#FFFDF5] border border-[#A47864]/25 rounded text-[#A47864]">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right: Signed-in User, Role Badge, Switcher, Sign-out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] hover:bg-[#F5EBD3] border border-transparent hover:border-[#A47864]/25 text-xs cursor-pointer transition-all"
                title="Switch demo user"
              >
                <div className="w-6 h-6 rounded-full bg-[#F5EBD3] border border-[#A47864]/25 flex items-center justify-center font-mono text-[11px] font-medium text-[#3B2A24]">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-mono text-[12px] font-medium text-[#3B2A24] leading-none mb-0.5">
                    {user?.username}
                  </div>
                </div>
                {/* Role badge near the header: Burgundy Tint pill with burgundy text */}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase font-mono bg-[#F3E1E6] text-[#7A1F3D] border border-[#7A1F3D]/25"
                >
                  {user?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#A47864]" />
              </button>

              {roleMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setRoleMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-64 bg-[#FFFDF5] border border-[#A47864]/25 rounded-[14px] shadow-[0_4px_16px_rgba(59,42,36,0.10)] z-40 p-2 text-xs animate-in fade-in duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold text-[#A47864] tracking-wider border-b border-[#A47864]/20 mb-1">
                      Switch Role (Recruiter Demo)
                    </div>
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user?.username === acc.username;
                      return (
                        <button
                          key={acc.username}
                          type="button"
                          onClick={() => handleQuickSwitchRole(acc.username)}
                          className={`w-full text-left px-2.5 py-2 rounded-[10px] flex items-center justify-between cursor-pointer transition-all ${
                            isCurrent
                              ? "bg-[#F3E1E6] text-[#7A1F3D] font-medium"
                              : "hover:bg-[#F5EBD3] text-[#3B2A24]"
                          }`}
                        >
                          <div>
                            <div className="font-mono text-[11px] flex items-center gap-1.5">
                              <span>{acc.username}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase border ${getRoleBadgeClasses(
                                  acc.role
                                )}`}
                              >
                                {acc.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#A47864]">
                              {acc.label}
                            </div>
                          </div>
                          {isCurrent && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#7A1F3D]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-[#A47864]/25 hidden sm:block" />

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs text-[#A47864] hover:text-[#A63D2F] hover:bg-[#A63D2F]/10 border border-transparent hover:border-[#A63D2F]/25 cursor-pointer transition-all"
              title="Sign out of Sentinel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto transition-opacity duration-150">
          {children}
        </main>
      </div>

      {/* CTRL+K COMMAND PALETTE MODAL */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#3B2A24]/35 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setCmdOpen(false)}
          />
          {/* Command Palette Cream panel with soft Mocha shadow */}
          <div
            onKeyDown={handlePaletteKeyDown}
            className="relative w-full max-w-lg bg-[#FFFDF5] border border-[#A47864]/25 rounded-[14px] shadow-[0_8px_30px_rgba(59,42,36,0.12),0_2px_8px_rgba(59,42,36,0.06)] overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col"
          >
            {/* Search Input on Cosmic Latte */}
            <div className="p-3.5 border-b border-[#A47864]/25 flex items-center gap-2.5 bg-[#FFF8E7]">
              <Search className="w-4 h-4 text-[#A47864] shrink-0" />
              <input
                ref={cmdInputRef}
                type="text"
                value={cmdSearch}
                onChange={(e) => {
                  setCmdSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or jump to page..."
                className="w-full text-xs bg-transparent border-none focus:outline-none text-[#3B2A24] placeholder:text-[#A47864]/60"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#FFFDF5] border border-[#A47864]/25 rounded text-[#A47864] shrink-0">
                ESC
              </kbd>
            </div>

            {/* Command List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
              {filteredCommands.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A47864]">
                  No commands matching &quot;{cmdSearch}&quot;
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = cmd.icon;

                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-[10px] flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#F3E1E6] text-[#7A1F3D]"
                          : "hover:bg-[#F5EBD3] text-[#3B2A24]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-[#7A1F3D]" : "text-[#A47864]"
                          }`}
                        />
                        <div className="truncate">
                          <div className="font-medium truncate">{cmd.label}</div>
                          {cmd.sublabel && (
                            <div className="text-[10px] text-[#A47864] truncate">
                              {cmd.sublabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {cmd.shortcut && (
                        <span className="font-mono text-[10px] text-[#A47864] shrink-0 ml-2">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer tips on Cosmic Latte */}
            <div className="p-2.5 border-t border-[#A47864]/25 bg-[#FFF8E7] text-[10px] text-[#A47864] flex items-center justify-between font-mono">
              <span>Use ↑ / ↓ to navigate</span>
              <span>↵ to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
