"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  LayoutDashboard,
  Stethoscope,
  Thermometer,
  Bug,
  Database,
  Calculator,
  ClipboardList,
  Menu,
  X,
  ActivitySquare,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import clsx from "clsx";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/diagnosa", label: "Diagnosa", icon: Stethoscope },
  { href: "/dashboard/gejala", label: "Data Gejala", icon: Thermometer },
  { href: "/dashboard/penyakit", label: "Data Penyakit", icon: Bug },
  { href: "/dashboard/data-training", label: "Data Training", icon: Database },
  { href: "/dashboard/perhitungan", label: "Perhitungan", icon: Calculator },
  { href: "/dashboard/riwayat", label: "Riwayat", icon: ClipboardList },
];

function NavLinks({
  pathname,
  onNavigate,
  isCollapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  return (
    <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto py-2 overflow-x-hidden">
      {menu.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
            className={clsx(
              "group flex items-center rounded-xl transition-all duration-200 relative",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
              isActive
                ? "bg-primary text-white shadow-[var(--shadow-button)]"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon
              className={clsx(
                "shrink-0 transition-transform duration-200",
                isCollapsed ? "size-6" : "size-5",
                !isActive && "group-hover:scale-110",
                isActive && "text-white"
              )}
            />

            <span
              className={clsx(
                "text-sm font-semibold whitespace-nowrap transition-all duration-300",
                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
              )}
            >
              {item.label}
            </span>

            {/* Simple Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-14 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use a timeout to avoid synchronous setState warning during initial effect
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState === "true") {
      setTimeout(() => {
        setIsCollapsed(true);
      }, 0);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header (Solid) */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ActivitySquare className="size-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            POSKESDES
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={() => {}}
          role="presentation"
        />
      ) : null}

      {/* Mobile sidebar drawer */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ActivitySquare className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              POSKESDES
            </h1>
            <p className="text-xs text-slate-500 font-medium">Sistem Diagnosa Pasien</p>
          </div>
        </div>

        <div className="py-4 flex-1 overflow-hidden flex flex-col">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            isCollapsed={false}
          />
        </div>

        <div className="border-t border-slate-100 p-4 bg-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 font-medium">Administrator</p>
            </div>
          </div>
          <LogoutButton variant="sidebar" isCollapsed={false} />
        </div>
      </aside>

      {/* Desktop sidebar (Solid Full Height + Collapsible) */}
      <aside
        className={clsx(
          "sticky top-0 h-screen shrink-0 flex-col bg-white border-r border-slate-200 hidden lg:flex print:hidden shadow-sm z-30 transition-[width] duration-300 ease-in-out relative",
          isCollapsed ? "w-[88px]" : "w-[280px]"
        )}
      >
        <div className={clsx(
          "flex items-center py-8 border-b border-slate-100 overflow-hidden whitespace-nowrap transition-all duration-300",
          isCollapsed ? "px-4 justify-center" : "px-6 gap-4"
        )}>
          <div className="flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 shrink-0 size-12 transition-all duration-300">
            <ActivitySquare className="size-6" />
          </div>

          <div className={clsx(
            "transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
          )}>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              POSKESDES
            </h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
              Naive Bayes
            </p>
          </div>
        </div>

        <div className="flex-1 py-4 overflow-hidden flex flex-col">
          <NavLinks pathname={pathname} isCollapsed={isCollapsed} />
        </div>

        {/* User Profile Area at bottom */}
        <div className={clsx(
          "border-t border-slate-100 bg-slate-50/50 transition-all duration-300",
          isCollapsed ? "p-3" : "p-5"
        )}>
          <div className={clsx(
            "flex items-center mb-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden",
            isCollapsed ? "justify-center p-2" : "gap-3 p-3"
          )}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              {isCollapsed ? getInitials(userName) : <ShieldCheck className="size-5" />}
            </div>

            <div className={clsx(
              "flex-1 min-w-0 transition-all duration-300",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
            )}>
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 font-medium">Administrator</p>
            </div>
          </div>

          <LogoutButton variant="sidebar" isCollapsed={isCollapsed} />
        </div>

        {/* Toggle Button Container - positioned on the border */}
        <div className="absolute -right-3.5 top-10 z-50">
          <button
            onClick={toggleCollapse}
            className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Spacer for mobile fixed header */}
        <div className="h-[60px] lg:hidden print:hidden shrink-0" />

        <main className="flex-1 w-full print:min-h-0">
          <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 xl:py-10 print:max-w-none print:px-0 print:py-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}