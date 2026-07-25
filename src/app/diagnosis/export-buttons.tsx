"use client";

import { useCallback, useState } from "react";
import { Printer, FileDown, Loader2 } from "lucide-react";

type ExportButtonsProps = {
  printUrl: string;
  resultElementId?: string;
  fileName?: string;
};

export function ExportButtons({
  printUrl,
  resultElementId = "diagnosis-result",
  fileName = "Laporan-Diagnosis-Balita",
}: ExportButtonsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const node = document.getElementById(resultElementId);
      if (!node) {
        window.open(printUrl, "_blank");
        setDownloading(false);
        return;
      }

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF("p", "mm", "a4");
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
    } catch {
      alert("Gagal mengunduh PDF. Mengalihkan ke jendela cetak...");
      window.open(printUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [resultElementId, fileName, printUrl]);

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
