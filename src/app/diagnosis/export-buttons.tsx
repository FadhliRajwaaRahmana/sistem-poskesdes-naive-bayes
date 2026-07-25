"use client";

import { useCallback, useRef, useState } from "react";
import { Printer, ImageDown, Loader2 } from "lucide-react";

type ExportButtonsProps = {
  printUrl: string;
  resultElementId: string;
  fileName: string;
};

export function ExportButtons({ printUrl, resultElementId, fileName }: ExportButtonsProps) {
  const [saving, setSaving] = useState(false);
  const abortRef = useRef(false);

  const savePng = useCallback(async () => {
    const node = document.getElementById(resultElementId);
    if (!node) return;

    setSaving(true);
    abortRef.current = false;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
          boxShadow: "none",
        },
      });

      if (abortRef.current) return;

      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Gagal menyimpan gambar. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }, [resultElementId, fileName]);

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={printUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
      >
        <Printer className="size-4.5" />
        Cetak / PDF
      </a>
      <button
        type="button"
        onClick={savePng}
        disabled={saving}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border-2 border-primary bg-primary/5 px-6 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
      >
        {saving ? (
          <Loader2 className="size-4.5 animate-spin" />
        ) : (
          <ImageDown className="size-4.5" />
        )}
        {saving ? "Menyimpan..." : "Simpan Gambar"}
      </button>
    </div>
  );
}
