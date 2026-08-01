import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { ExportButtons } from "@/app/diagnosis/export-buttons";
import { PrintTrigger } from "@/app/diagnosis/print-trigger";
import {
  BarChart3,
  Calendar,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type LaporanPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function sv(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};

  const now = new Date();
  const selectedYear = sv(params.tahun) || String(now.getFullYear());
  const selectedMonth = sv(params.bulan);
  const isPrint = sv(params.print) === "1";

  const yearNum = Number.parseInt(selectedYear, 10);

  const startDate = selectedMonth
    ? new Date(yearNum, Number.parseInt(selectedMonth, 10) - 1, 1)
    : new Date(yearNum, 0, 1);
  const endDate = selectedMonth
    ? new Date(yearNum, Number.parseInt(selectedMonth, 10), 1)
    : new Date(yearNum + 1, 0, 1);

  const records = await prisma.diagnosisBalita.findMany({
    where: {
      tanggal: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: { penyakit: true },
    orderBy: { tanggal: "desc" },
  });

  const totalDiagnosis = records.length;
  const giziBaikCount = records.filter((r) => r.hasilDiagnosis === "Gizi Baik").length;
  const giziBurukCount = totalDiagnosis - giziBaikCount;

  const dusunCounts = new Map<string, { total: number; baik: number; buruk: number }>();
  for (const r of records) {
    const entry = dusunCounts.get(r.dusun) ?? { total: 0, baik: 0, buruk: 0 };
    entry.total++;
    if (r.hasilDiagnosis === "Gizi Baik") entry.baik++;
    else entry.buruk++;
    dusunCounts.set(r.dusun, entry);
  }

  const sortedDusun = Array.from(dusunCounts.entries()).sort(([, a], [, b]) => b.total - a.total);

  const periodLabel = selectedMonth
    ? `${monthNames[Number.parseInt(selectedMonth, 10) - 1]} ${selectedYear}`
    : `Tahun ${selectedYear}`;

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const availableYears: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    availableYears.push(y);
  }

  const printUrl = new URLSearchParams();
  printUrl.set("tahun", selectedYear);
  if (selectedMonth) printUrl.set("bulan", selectedMonth);
  printUrl.set("print", "1");

  if (isPrint) {
    return (
      <section className="min-h-screen bg-white text-slate-900 font-sans print:p-0">
        <style>{`
          @media print {
            @page { margin: 10mm 10mm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen {
            section { max-width: 800px; margin: 0 auto; padding: 32px 28px; }
          }
        `}</style>
        <PrintTrigger />

        {/* Header */}
        <div className="border-b-[3px] border-slate-800 pb-3 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-xl font-black tracking-tight leading-tight">Laporan Rekap Diagnosis</h1>
              <p className="mt-1 text-sm font-bold text-slate-700">Periode: {periodLabel}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">Tanggal Cetak</p>
              <p className="text-xs font-black">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg border-2 border-slate-200 p-4 text-center" style={{ backgroundColor: "#f8fafc" }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Diagnosis</p>
            <p className="text-2xl font-black text-slate-900">{totalDiagnosis}</p>
          </div>
          <div className="rounded-lg border-2 border-emerald-300 p-4 text-center" style={{ backgroundColor: "#ecfdf5" }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#059669" }}>Gizi Baik</p>
            <p className="text-2xl font-black" style={{ color: "#065f46" }}>{giziBaikCount}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: "#059669" }}>
              {totalDiagnosis > 0 ? `${((giziBaikCount / totalDiagnosis) * 100).toFixed(1)}%` : "0%"}
            </p>
          </div>
          <div className="rounded-lg border-2 border-rose-300 p-4 text-center" style={{ backgroundColor: "#fff1f2" }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#e11d48" }}>Gizi Buruk</p>
            <p className="text-2xl font-black" style={{ color: "#9f1239" }}>{giziBurukCount}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: "#e11d48" }}>
              {totalDiagnosis > 0 ? `${((giziBurukCount / totalDiagnosis) * 100).toFixed(1)}%` : "0%"}
            </p>
          </div>
        </div>

        {/* Distribusi Dusun */}
        {sortedDusun.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Distribusi per Dusun
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-left" style={{ backgroundColor: "#f1f5f9" }}>
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Dusun</th>
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider text-right">Total</th>
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider text-right">Gizi Baik</th>
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider text-right">Gizi Buruk</th>
                </tr>
              </thead>
              <tbody>
                {sortedDusun.map(([dusun, data], i) => (
                  <tr key={dusun} className="border-b border-slate-200" style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "transparent" }}>
                    <td className="p-2.5 font-bold text-slate-900">{dusun}</td>
                    <td className="p-2.5 text-right font-black">{data.total}</td>
                    <td className="p-2.5 text-right font-bold" style={{ color: "#059669" }}>{data.baik}</td>
                    <td className="p-2.5 text-right font-bold" style={{ color: "#e11d48" }}>{data.buruk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Daftar Detail */}
        {records.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Daftar Detail Diagnosis ({records.length} data)
            </h2>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-left" style={{ backgroundColor: "#f1f5f9" }}>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">No</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">Tanggal</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">Nama</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">JK</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">Dusun</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">Umur</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">BB/TB</th>
                  <th className="p-2 font-black text-[10px] uppercase tracking-wider">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-100" style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "transparent" }}>
                    <td className="p-2 font-semibold text-slate-500">{i + 1}</td>
                    <td className="p-2">{dateFormatter.format(r.tanggal)}</td>
                    <td className="p-2 font-bold text-slate-900">{r.namaBalita}</td>
                    <td className="p-2">{r.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</td>
                    <td className="p-2">{r.dusun}</td>
                    <td className="p-2">{r.umurBulan} bln</td>
                    <td className="p-2">{r.beratBadan}/{r.tinggiBadan}</td>
                    <td className="p-2 font-bold" style={{ color: r.hasilDiagnosis === "Gizi Baik" ? "#059669" : "#e11d48" }}>{r.hasilDiagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-[3px] border-slate-800 pt-3 mt-6">
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
            <p>Sistem Diagnosis Gizi Balita — Metode Naive Bayes</p>
            <p>Dicetak: {dateFormatter.format(new Date())}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Data Laporan</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Rekap statistik diagnosis gizi bulanan dan tahunan.
            </p>
          </div>
        </div>
      </div>

      {/* Filter + Cetak */}
      <div className="card-container">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form method="get" className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Tahun
              </label>
              <select name="tahun" defaultValue={selectedYear} className="input-field h-11 bg-white font-bold cursor-pointer w-32">
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Bulan
              </label>
              <select name="bulan" defaultValue={selectedMonth} className="input-field h-11 bg-white font-bold cursor-pointer w-40">
                <option value="">Semua Bulan (Tahunan)</option>
                {monthNames.map((name, i) => (
                  <option key={i} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl transition-all active:scale-95 px-6 font-bold"
            >
              Tampilkan
            </button>
          </form>
          <div className="flex flex-wrap gap-3">
            <ExportButtons
              printUrl={`/dashboard/laporan?${printUrl.toString()}`}
            />
          </div>
        </div>
      </div>

      {/* Distribution by Dusun */}
      {sortedDusun.length > 0 && (
        <div className="card-container !p-0 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi per Dusun</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{periodLabel}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 font-black text-xs uppercase tracking-wider text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="h-14 px-6 text-left">Dusun</th>
                  <th className="h-14 px-6 text-right">Total</th>
                  <th className="h-14 px-6 text-right">Gizi Baik</th>
                  <th className="h-14 px-6 text-right">Gizi Buruk</th>
                </tr>
              </thead>
              <tbody>
                {sortedDusun.map(([dusun, data]) => (
                  <tr key={dusun} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 px-6 font-bold text-slate-900">{dusun}</td>
                    <td className="p-4 px-6 text-right font-black text-slate-900">{data.total}</td>
                    <td className="p-4 px-6 text-right font-bold text-emerald-700">{data.baik}</td>
                    <td className="p-4 px-6 text-right font-bold text-rose-700">{data.buruk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalDiagnosis === 0 && (
        <div className="card-container text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-400 mb-6 shadow-sm">
            <BarChart3 className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Belum Ada Data</h3>
          <p className="mt-2 text-sm text-slate-500 font-medium">Tidak ada diagnosis pada periode {periodLabel}.</p>
        </div>
      )}
    </section>
  );
}
