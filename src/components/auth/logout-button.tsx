"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({
  variant = "default",
  isCollapsed = false
}: {
  variant?: "default" | "sidebar";
  isCollapsed?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      title={isCollapsed ? "Keluar Sistem" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden relative group",
        isCollapsed ? "justify-center p-3" : "justify-center px-4 py-3 text-sm",
        variant === "sidebar"
          ? "bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm active:scale-95"
          : "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
      )}
    >
      <LogOut className={cn("shrink-0", isCollapsed ? "size-5" : "size-4")} />

      <span className={cn(
        "whitespace-nowrap transition-all duration-300",
        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
      )}>
        {isPending ? "Keluar..." : "Keluar Sistem"}
      </span>

      {/* Tooltip for collapsed state */}
      {isCollapsed && variant === "sidebar" && (
        <div className="absolute left-14 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
          Keluar Sistem
        </div>
      )}
    </button>
  );
}
