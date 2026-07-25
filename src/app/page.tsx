import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasAdminRole } from "@/lib/session-guards";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user && hasAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  redirect("/diagnosis");
}
