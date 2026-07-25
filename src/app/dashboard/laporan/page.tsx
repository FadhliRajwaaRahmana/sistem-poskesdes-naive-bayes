import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import {
  BarChart3,
  Printer,
  Calendar,
  CheckCircle2,
  ShieldAlert,
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

  const resultCounts = new Map<string, number>();
  for (const r of records) {
    const key = r.hasilDiagnosis;
    resultCounts.set(key, (resultCounts.get(key) ?? 0) + 1);
  }

  const sortedResults = Array.from(resultCounts.entries()).sort(([, a], [, b]) => b - a);

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
      <section className="space-y-6 bg-white text-black print:p-0 font-sans">
        <Script id="print-trigger" strategy="afterInteractive">
          {`window.addEventListener("load",function(){setTimeout(function(){window.print()},300)});`}
        </Script>
        <div className="border-b-2 border-slate-900 pb-5">
          <h1 className="text-3xl font-black tracking-tight">Laporan Diagnosis POSYANDU</h1>
          <p className="mt-1 text-lg font-bold text-slate-700">Periode: {periodLabel}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">Tanggal Cetak: {dateFormatter.format(new Date())}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="border border-slate-200 rounded-lg p-4 text-center">
            <p className="font-black text-slate-500 text-xs uppercase mb-1">Total Diagnosis</p>
            <p className="font-black text-2xl">{totalDiagnosis}</p>
          </div>
          <div className="border border-emerald-200 rounded-lg p-4 text-center">
            <p className="font-black text-emerald-600 text-xs uppercase mb-1">Gizi Baik</p>
            <p className="font-black text-2xl text-emerald-700">{giziBaikCount}</p>
          </div>
          <div className="border border-rose-200 rounded-lg p-4 text-center">
            <p className="font-black text-rose-600 text-xs uppercase mb-1">Gizi Buruk</p>
            <p className="font-black text-2xl text-rose-700">{giziBurukCount}</p>
          </div>
        </div>

        {sortedResults.length > 0 && (
          <div>
            <p className="font-black text-slate-500 text-xs uppercase mb-2">Distribusi Hasil</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left font-black text-xs uppercase tracking-wider">
                  <th className="p-3">Hasil Diagnosis</th>
                  <th className="p-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map(([result, count]) => (
                  <tr key={result} className="border-b border-slate-200">
                    <td className="p-3 font-bold">{result}</td>
                    <td className="p-3 text-right font-black">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedDusun.length > 0 && (
          <div>
            <p className="font-black text-slate-500 text-xs uppercase mb-2">Distribusi per Dusun</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left font-black text-xs uppercase tracking-wider">
                  <th className="p-3">Dusun</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Baik</th>
                  <th className="p-3 text-right">Buruk</th>
                </tr>
              </thead>
              <tbody>
                {sortedDusun.map(([dusun, data]) => (
                  <tr key={dusun} className="border-b border-slate-200">
                    <td className="p-3 font-bold">{dusun}</td>
                    <td className="p-3 text-right font-black">{data.total}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{data.baik}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{data.buruk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Filter */}
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
          <a
            href={`/dashboard/laporan?${printUrl.toString()}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="card-container text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Diagnosis</p>
          <p className="text-4xl font-black text-slate-900">{totalDiagnosis}</p>
          <p className="text-sm font-semibold text-slate-500 mt-2">{periodLabel}</p>
        </div>
        <div className="card-container text-center border-emerald-200">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Gizi Baik</p>
          <p className="text-4xl font-black text-emerald-700">{giziBaikCount}</p>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            {totalDiagnosis > 0 ? `${((giziBaikCount / totalDiagnosis) * 100).toFixed(1)}%` : "0%"}
          </p>
        </div>
        <div className="card-container text-center border-rose-200">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="size-6 text-rose-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Gizi Buruk</p>
          <p className="text-4xl font-black text-rose-700">{giziBurukCount}</p>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            {totalDiagnosis > 0 ? `${((giziBurukCount / totalDiagnosis) * 100).toFixed(1)}%` : "0%"}
          </p>
        </div>
      </div>

      {/* Distribution by Result */}
      {sortedResults.length > 0 && (
        <div className="card-container !p-0 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Hasil Diagnosis</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{periodLabel}</p>
          </div>
          <div className="p-6 lg:p-8 space-y-4">
            {sortedResults.map(([result, count]) => {
              const pct = totalDiagnosis > 0 ? (count / totalDiagnosis) * 100 : 0;
              const isGiziBaik = result === "Gizi Baik";
              return (
                <div key={result} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isGiziBaik ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="size-4 text-rose-600" />
                      )}
                      <span className="text-sm font-bold text-slate-700">{result}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{count} <span className="font-semibold text-slate-500">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isGiziBaik ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
