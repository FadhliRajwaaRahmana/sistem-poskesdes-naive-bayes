"use client";

import { useEffect, useState } from "react";

type Props = {
  mode: "print" | "pdf";
  fileName?: string;
  orientation?: "portrait" | "landscape";
};

export function PrintOrPdfTrigger({ mode, fileName = "Laporan", orientation = "portrait" }: Props) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (mode === "print") {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }

    let cancelled = false;

    const generate = async () => {
      setStatus("generating");
      try {
        await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 600));

        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");

        const section = document.querySelector("section") as HTMLElement | null;
        if (!section) throw new Error("Section not found");

        const isLandscape = orientation === "landscape";

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: section.scrollWidth || (isLandscape ? 1100 : 800),
        });

        if (cancelled) return;

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
        setStatus("done");

        setTimeout(() => {
          try { window.close(); } catch {}
        }, 1200);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF generation failed:", err);
        setStatus("error");
        window.print();
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [mode, fileName, orientation]);

  if (mode !== "pdf" || !status) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 print:hidden rounded-xl border-2 shadow-xl px-5 py-3 text-sm font-bold"
      style={{
        backgroundColor: status === "done" ? "#ecfdf5" : status === "error" ? "#fff1f2" : "#eff6ff",
        borderColor: status === "done" ? "#34d399" : status === "error" ? "#fda4af" : "#93c5fd",
        color: status === "done" ? "#065f46" : status === "error" ? "#9f1239" : "#1e40af",
      }}
    >
      {status === "generating" && "Menghasilkan PDF..."}
      {status === "done" && "PDF berhasil diunduh!"}
      {status === "error" && "Gagal, mode cetak dibuka sebagai fallback."}
    </div>
  );
}
