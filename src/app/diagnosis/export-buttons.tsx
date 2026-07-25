"use client";

import { useCallback, useState } from "react";
import { Printer, FileDown, Loader2 } from "lucide-react";

type ExportButtonsProps = {
  printUrl: string;
  resultElementId?: string;
  fileName?: string;
  compact?: boolean;
  orientation?: "portrait" | "landscape";
};

export function ExportButtons({
  printUrl,
  resultElementId = "diagnosis-result",
  fileName = "Laporan-Diagnosis-Balita",
  compact = false,
  orientation = "portrait",
}: ExportButtonsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    let cleanupFn: (() => void) | null = null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      let targetNode = document.getElementById(resultElementId);

      // If element is not present on current page (e.g. from table row or report),
      // fetch printUrl HTML in background with cookies/credentials and render in hidden container
      if (!targetNode) {
        const res = await fetch(printUrl, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const htmlText = await res.text();

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = orientation === "landscape" ? "1100px" : "800px";
        container.style.backgroundColor = "#ffffff";
        container.style.zIndex = "-9999";
        container.innerHTML = htmlText;

        // Ensure section content inside container is visible
        const section = container.querySelector("section");
        if (section) {
          section.style.minHeight = "auto";
          section.style.padding = "20px";
        }

        document.body.appendChild(container);
        cleanupFn = () => {
          if (container.parentNode) container.parentNode.removeChild(container);
        };

        targetNode = (section || container) as HTMLElement;
      }

      if (!targetNode) {
        throw new Error("Target elemen tidak ditemukan.");
      }

      const isLandscape = orientation === "landscape";
      const imgWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;

      const canvas = await html2canvas(targetNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetNode.scrollWidth || (isLandscape ? 1100 : 800),
      });

      if (cleanupFn) cleanupFn();

      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF(isLandscape ? "l" : "p", "mm", "a4");
      let position = 0;

      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`${fileName}.pdf`);
    } catch (err) {
      if (cleanupFn) cleanupFn();
      console.error("Gagal mengunduh PDF secara langsung:", err);
      // Quiet fallback without annoying alert popups
      window.open(printUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [resultElementId, fileName, printUrl, orientation]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={printUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0"
        >
          <Printer className="size-3.5 text-slate-700 stroke-[2.5]" />
          <span>Cetak</span>
        </a>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-extrabold text-rose-800 shadow-sm transition-all hover:bg-rose-100 hover:text-rose-900 active:scale-95 disabled:opacity-60 disabled:cursor-wait shrink-0"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin text-rose-700" />
          ) : (
            <FileDown className="size-3.5 text-rose-700 stroke-[2.5]" />
          )}
          <span>{downloading ? "..." : "PDF"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 my-2">
      {/* Tombol 1: Cetak Print */}
      <a
        href={printUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 active:scale-95 shrink-0"
      >
        <Printer className="size-4 text-slate-700 stroke-[2.5]" />
        <span>Cetak Print</span>
      </a>

      {/* Tombol 2: Cetak PDF */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 px-5 text-sm font-extrabold text-rose-800 shadow-sm transition-all hover:bg-rose-100 hover:border-rose-400 hover:text-rose-900 active:scale-95 disabled:opacity-60 disabled:cursor-wait shrink-0"
      >
        {downloading ? (
          <Loader2 className="size-4 animate-spin text-rose-700" />
        ) : (
          <FileDown className="size-4 text-rose-700 stroke-[2.5]" />
        )}
        <span>{downloading ? "Mengunduh PDF..." : "Cetak PDF"}</span>
      </button>
    </div>
  );
}
