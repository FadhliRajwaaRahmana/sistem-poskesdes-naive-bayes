import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <DashboardShell userName={session.user.name} userRole={session.user.role ?? "USER"}>
      {children}
    </DashboardShell>
  );
}
