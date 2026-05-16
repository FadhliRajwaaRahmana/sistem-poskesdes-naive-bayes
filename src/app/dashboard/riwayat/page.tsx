import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { computePemantauanStatus, type PemantauanStatus } from "@/lib/diagnosis-helpers";
import {
  History,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  Activity,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type RiwayatPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function sv(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function pv(value: string | string[] | undefined) {
  if (typeof value !== "string") return 1;
  const p = Number.parseInt(value, 10);
  return Number.isNaN(p) || p < 1 ? 1 : p;
}

function buildHref(
  base: string,
  filters: Record<string, string | number | boolean | undefined>,
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "" && v !== false) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

const STATUS_COLOR: Record<PemantauanStatus, string> = {
  "Kondisi Awal": "bg-slate-100 text-slate-700 border-slate-200",
  Tetap: "bg-blue-50 text-blue-700 border-blue-200",
  Menurun: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Meningkat: "bg-rose-50 text-rose-700 border-rose-200",
  "Membaik (Pindah Kategori)": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Memburuk (Pindah Kategori)": "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function RiwayatPage({ searchParams }: RiwayatPageProps) {
  const session = await requireSession();
  const userId = session.user.id;
  const params = searchParams ? await searchParams : {};

  const pemantauanNik = sv(params.nik);
  const isPrint = sv(params.print) === "1";
  const requestedPage = pv(params.page);
  const isPemantauan = Boolean(pemantauanNik);

  const basePath = "/dashboard/riwayat";

  // ── PEMANTAUAN VIEW ──
  if (isPemantauan) {
    const records = await prisma.diagnosisBalita.findMany({
      where: { nik: pemantauanNik, userId },
      include: {
        penyakit: true,
        diagnosisRanking: { orderBy: { peringkat: "asc" }, take: 1 },
      },
      orderBy: { tanggal: "asc" },
    });

    const pemantauanData = records.map((rec, idx) => {
      const topRanking = rec.diagnosisRanking[0];
      const percentage = topRanking ? topRanking.posterior : 0;
      const prevRec = idx > 0 ? records[idx - 1] : null;
      const prevTopRanking = prevRec?.diagnosisRanking[0];
      const status = computePemantauanStatus(
        rec.hasilDiagnosis,
        percentage,
        prevRec?.hasilDiagnosis ?? null,
        prevTopRanking?.posterior ?? null,
      );
      return { ...rec, percentage, status };
    });

    const childName = records[0]?.namaBalita ?? pemantauanNik;

    if (isPrint) {
      return (
        <section className="space-y-6 bg-white text-black print:p-0 font-sans">
          <Script id="print-trigger" strategy="afterInteractive">
            {`window.addEventListener("load",function(){setTimeout(function(){window.print()},300)});`}
          </Script>
          <div className="border-b-2 border-slate-900 pb-5">
            <h1 className="text-3xl font-black tracking-tight">Laporan Pemantauan Balita</h1>
            <p className="mt-1 text-lg font-bold text-slate-700">{childName} (NIK: {pemantauanNik})</p>
            <p className="mt-2 text-sm font-bold text-slate-500">Tanggal Cetak: {dateFormatter.format(new Date())}</p>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left font-black text-xs uppercase tracking-wider">
                <th className="p-3">No</th>
                <th className="p-3">Tgl Periksa</th>
                <th className="p-3">Hasil Diagnosis</th>
                <th className="p-3">Persentase</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pemantauanData.map((row, i) => (
                <tr key={row.id} className="border-b border-slate-200">
                  <td className="p-3 font-bold">{i + 1}</td>
                  <td className="p-3">{dateFormatter.format(row.tanggal)}</td>
                  <td className="p-3 font-bold">{row.hasilDiagnosis}</td>
                  <td className="p-3 font-bold">{row.percentage.toFixed(2)}%</td>
                  <td className="p-3 font-bold">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }

    return (
      <section className="animate-fade-in space-y-8 pb-10">
        <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10">
            <Link
              href={basePath}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="size-4" /> Kembali ke Riwayat
            </Link>
            <div className="flex items-center gap-5">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Pemantauan Balita</h2>
                <p className="text-slate-300 mt-2 font-medium">
                  {childName} &mdash; NIK: {pemantauanNik}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <a
            href={buildHref(basePath, { nik: pemantauanNik, print: "1" })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Printer className="size-4" /> Cetak Pemantauan
          </a>
        </div>

        <div className="card-container !p-0 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 font-black text-xs uppercase tracking-wider text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="h-14 px-6 text-left">No</th>
                  <th className="h-14 px-6 text-left">Tgl Periksa</th>
                  <th className="h-14 px-6 text-left">Umur</th>
                  <th className="h-14 px-6 text-left">BB / TB</th>
                  <th className="h-14 px-6 text-left">Hasil Diagnosis</th>
                  <th className="h-14 px-6 text-right">Persentase</th>
                  <th className="h-14 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pemantauanData.map((row, i) => {
                  const isGiziBaik = row.hasilDiagnosis === "Gizi Baik";
                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 px-6 font-bold text-slate-500">{i + 1}</td>
                      <td className="p-4 px-6 font-semibold text-slate-700">{dateFormatter.format(row.tanggal)}</td>
                      <td className="p-4 px-6 font-semibold text-slate-700">{row.umurBulan} bln</td>
                      <td className="p-4 px-6 font-semibold text-slate-700">{row.beratBadan} kg / {row.tinggiBadan} cm</td>
                      <td className="p-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black border shadow-sm ${
                          isGiziBaik ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {isGiziBaik ? <CheckCircle2 className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                          {row.hasilDiagnosis}
                        </span>
                      </td>
                      <td className="p-4 px-6 font-black text-slate-900 text-right">{row.percentage.toFixed(2)}%</td>
                      <td className="p-4 px-6 text-center">
                        <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-black border shadow-sm ${STATUS_COLOR[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pemantauanData.length === 0 && (
            <div className="p-16 text-center">
              <p className="text-lg font-black text-slate-800">Belum ada data pemantauan</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Tidak ada riwayat diagnosis untuk NIK ini.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── LIST VIEW ──
  const where: Record<string, unknown> = { userId };

  const totalRecords = await prisma.diagnosisBalita.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const records = await prisma.diagnosisBalita.findMany({
    where,
    include: { penyakit: true },
    orderBy: { tanggal: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <section className="animate-fade-in space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <History className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Riwayat Saya</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Riwayat diagnosis balita yang Anda lakukan. Klik nama balita untuk melihat pemantauan.
            </p>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Daftar Riwayat</h3>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Total <span className="font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">{totalRecords}</span> data
          </p>
        </div>

        {/* Records */}
        <div className="p-4 sm:p-6 bg-slate-50/30">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 mb-5 shadow-sm">
                <History className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                Belum Ada Riwayat
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-md leading-relaxed">
                Anda belum melakukan diagnosis. Silakan mulai dari menu Diagnosis Balita.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((rec) => {
                const isGiziBaik = rec.hasilDiagnosis === "Gizi Baik";
                return (
                  <div key={rec.id} className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={buildHref(basePath, { nik: rec.nik })}
                            className="text-lg font-black text-primary hover:underline truncate"
                          >
                            {rec.namaBalita}
                          </Link>
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black border shadow-sm shrink-0 ${
                            isGiziBaik ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {isGiziBaik ? <CheckCircle2 className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                            {rec.hasilDiagnosis}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{dateFormatter.format(rec.tanggal)}</span>
                          <span>NIK: {rec.nik}</span>
                          <span>Dusun: {rec.dusun}</span>
                          <span>{rec.umurBulan} bln &bull; {rec.beratBadan} kg / {rec.tinggiBadan} cm</span>
                        </div>
                      </div>
                      <Link
                        href={buildHref("/dashboard/rekam-medis", { diagnosisId: rec.id, print: "1" })}
                        target="_blank"
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary active:scale-95 transition-all shrink-0"
                      >
                        <Printer className="size-3.5" /> Cetak
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row">
            <p className="text-sm font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalRecords)}</span> dari <span className="font-bold text-slate-800">{totalRecords}</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href={buildHref(basePath, { page: currentPage - 1 })}
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-10 items-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage <= 1 ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black border border-primary/20">
                {currentPage}
              </span>
              <a
                href={buildHref(basePath, { page: currentPage + 1 })}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-10 items-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage >= totalPages ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Selanjutnya <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
