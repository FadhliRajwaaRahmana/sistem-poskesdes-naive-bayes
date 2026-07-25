"use client";

import { useTransition } from "react";
import { deleteDiagnosis } from "@/actions/diagnosis";
import { Trash2 } from "lucide-react";

export function DeleteDiagnosisButton({ id, namaBalita }: { id: string; namaBalita: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Hapus data diagnosis "${namaBalita}"? Tindakan ini tidak dapat dibatalkan.`)) {
          return;
        }
        startTransition(async () => {
          await deleteDiagnosis(id);
        });
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50 active:scale-95 transition-all disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
      {isPending ? "..." : "Hapus"}
    </button>
  );
}
