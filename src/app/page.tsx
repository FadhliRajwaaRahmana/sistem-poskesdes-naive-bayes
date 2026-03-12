import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/session-guards";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  redirect(session?.user && hasAdminRole(session.user.role) ? "/dashboard" : "/login");
}
