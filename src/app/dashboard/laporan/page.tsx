import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
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

  const availableYears: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    availableYears.push(y);
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

      {records.length === 0 && (
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
