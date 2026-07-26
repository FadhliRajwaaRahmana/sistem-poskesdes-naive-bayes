"use client";

import { Printer } from "lucide-react";

type ExportButtonsProps = {
  printUrl: string;
  compact?: boolean;
};

export function ExportButtons({ printUrl, compact = false }: ExportButtonsProps) {
  if (compact) {
    return (
      <a
        href={printUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0"
      >
        <Printer className="size-3.5 text-slate-700 stroke-[2.5]" />
        <span>Cetak</span>
      </a>
    );
  }

  return (
    <a
      href={printUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 active:scale-95 shrink-0"
    >
      <Printer className="size-4 text-slate-700 stroke-[2.5]" />
      <span>Cetak / PDF</span>
    </a>
  );
}
