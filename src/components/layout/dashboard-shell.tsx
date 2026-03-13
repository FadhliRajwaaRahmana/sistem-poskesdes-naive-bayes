"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/diagnosa", label: "Diagnosa", icon: Stethoscope },
  { href: "/dashboard/gejala", label: "Data Gejala", icon: Thermometer },
  { href: "/dashboard/penyakit", label: "Data Penyakit", icon: Bug },
  { href: "/dashboard/data-training", label: "Data Training", icon: Database },
  { href: "/dashboard/perhitungan", label: "Perhitungan", icon: Calculator },
  { href: "/dashboard/riwayat", label: "Riwayat", icon: ClipboardList },
];

const sidebarCollapsedStorageKey = "sidebar-collapsed";
const sidebarCollapsedEvent = "sidebar-collapsed-change";

function subscribeToSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(sidebarCollapsedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(sidebarCollapsedEvent, onStoreChange);
  };
}

function getSidebarCollapsedSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(sidebarCollapsedStorageKey) === "true";
}

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
    <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto overflow-x-hidden clean-scroll">
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
            className={cn(
              "group relative flex items-center rounded-xl transition-all duration-300",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
              isActive
                ? "text-primary-foreground"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute inset-0 bg-primary rounded-xl shadow-[var(--shadow-button)]"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <item.icon
              className={cn(
                "relative z-10 shrink-0 transition-transform duration-300",
                isCollapsed ? "size-6" : "size-5",
                !isActive && "group-hover:scale-110",
                isActive && "text-white"
              )}
            />

            <span
              className={cn(
                "relative z-10 text-sm font-bold whitespace-nowrap transition-all duration-300",
                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900",
                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
              )}
            >
              {item.label}
            </span>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-14 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
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
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarCollapsedSnapshot,
    () => false,
  );

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    window.localStorage.setItem(sidebarCollapsedStorageKey, String(newState));
    window.dispatchEvent(new Event(sidebarCollapsedEvent));
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile Header (Glassmorphism) */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-slate-200/50 bg-white/80 backdrop-blur-md px-4 py-3 lg:hidden print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-md shadow-primary/20">
            <ActivitySquare className="size-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            POSKESDES
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile Sidebar via Framer Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white border-r border-slate-200 lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-lg shadow-primary/20">
                    <ActivitySquare className="size-5" />
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                      POSKESDES
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Naive Bayes</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                  isCollapsed={false}
                />
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 font-medium">Administrator</p>
                  </div>
                </div>
                <LogoutButton variant="sidebar" isCollapsed={false} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 88 : 280 }}
        className="sticky top-0 h-screen shrink-0 flex-col bg-white border-r border-slate-200 hidden lg:flex print:hidden shadow-sm z-30 relative"
      >
        <div className={cn(
          "flex items-center py-6 border-b border-slate-100 overflow-hidden whitespace-nowrap transition-all duration-300",
          isCollapsed ? "px-4 justify-center" : "px-6 gap-4"
        )}>
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-lg shadow-primary/20 shrink-0 size-11 transition-all duration-300">
            <ActivitySquare className="size-6" />
          </div>

          <div className={cn(
            "transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
          )}>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              POSKESDES
            </h1>
            <p className="text-[10px] text-teal-600 font-bold tracking-widest uppercase mt-0.5">
              Naive Bayes
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <NavLinks pathname={pathname} isCollapsed={isCollapsed} />
        </div>

        {/* User Profile Area */}
        <div className={cn(
          "border-t border-slate-100 bg-slate-50/50 transition-all duration-300",
          isCollapsed ? "p-3" : "p-5"
        )}>
          <div className={cn(
            "flex items-center mb-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden",
            isCollapsed ? "justify-center p-2" : "gap-3 p-3"
          )}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold">
              {isCollapsed ? getInitials(userName) : <ShieldCheck className="size-5" />}
            </div>

            <div className={cn(
              "flex-1 min-w-0 transition-all duration-300",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
            )}>
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 font-medium">Administrator</p>
            </div>
          </div>

          <LogoutButton variant="sidebar" isCollapsed={isCollapsed} />
        </div>

        {/* Toggle Button Container */}
        <div className="absolute -right-3.5 top-8 z-50">
          <button
            onClick={toggleCollapse}
            className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="h-[60px] lg:hidden print:hidden shrink-0" />
        <main className="flex-1 w-full print:min-h-0">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 xl:py-8 print:max-w-none print:px-0 print:py-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
