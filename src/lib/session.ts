import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAdminRole } from "@/lib/session-guards";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAdminRole(session.user.role)) {
    redirect(`/login?error=${encodeURIComponent("Akun ini tidak memiliki akses admin.")}`);
  }

  return session;
}
