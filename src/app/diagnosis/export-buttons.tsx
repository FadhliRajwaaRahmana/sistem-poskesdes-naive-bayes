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

async function fetchAndInlineCSS(htmlText: string): Promise<{ section: HTMLElement; css: string }> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(htmlText, "text/html");

  const cssPromises: Promise<string>[] = [];
  parsed.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const url = href.startsWith("http") ? href : `${location.origin}${href}`;
      cssPromises.push(fetch(url).then((r) => r.text()).catch(() => ""));
    }
  });

  const fetched = await Promise.all(cssPromises);
  let css = fetched.join("\n");
  parsed.querySelectorAll("style").forEach((s) => {
    css += "\n" + (s.textContent || "");
  });

  const section = parsed.querySelector("section");
  if (!section) throw new Error("No printable section found");

  return { section, css };
}

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
    let tempContainer: HTMLDivElement | null = null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      let targetNode = document.getElementById(resultElementId);
      const isLandscape = orientation === "landscape";
      const containerWidth = isLandscape ? 1100 : 800;

      if (!targetNode) {
        const res = await fetch(printUrl, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const htmlText = await res.text();
        const { section, css } = await fetchAndInlineCSS(htmlText);

        tempContainer = document.createElement("div");
        tempContainer.style.cssText = `position:fixed;left:0;top:0;width:${containerWidth}px;background:#fff;z-index:-99999;opacity:0.01;pointer-events:none;overflow:visible;`;

        const styleEl = document.createElement("style");
        styleEl.textContent = css;
        tempContainer.appendChild(styleEl);

        const clone = document.importNode(section, true) as HTMLElement;
        clone.querySelectorAll("script").forEach((s) => s.remove());
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 600));

        targetNode = clone;
      }

      if (!targetNode) throw new Error("Target element not found");

      const canvas = await html2canvas(targetNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetNode.scrollWidth || containerWidth,
      });

      if (tempContainer?.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
        tempContainer = null;
      }

      const imgWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
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
      if (tempContainer?.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      console.error("Gagal mengunduh PDF:", err);
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
      <a
        href={printUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 active:scale-95 shrink-0"
      >
        <Printer className="size-4 text-slate-700 stroke-[2.5]" />
        <span>Cetak Print</span>
      </a>

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
