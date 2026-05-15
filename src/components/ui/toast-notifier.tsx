"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

export function ToastNotifier() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    const key = `${pathname}:${success ?? ""}:${error ?? ""}`;
    if (key === shown.current) return;
    shown.current = key;

    if (success) {
      toast.success(success);
    }
    if (error) {
      toast.error(error);
    }

    if (success || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, pathname]);

  return null;
}
