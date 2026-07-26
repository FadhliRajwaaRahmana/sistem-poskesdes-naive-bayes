import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { DeleteDiagnosisButton } from "./delete-button";
import { ExportButtons } from "@/app/diagnosis/export-buttons";
import { PrintTrigger } from "@/app/diagnosis/print-trigger";
import {
  FileText,
  Search,
  Filter,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  History,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type RiwayatDiagnosisPageProps = {
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

export default async function RiwayatDiagnosisPage({ searchParams }: RiwayatDiagnosisPageProps) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};

  const q = sv(params.q).trim();
  const filterDusun = sv(params.dusun);
  const filterStatus = sv(params.status);
  const diagnosisId = sv(params.diagnosisId);
  const isPrint = sv(params.print) === "1";
  const requestedPage = pv(params.page);

  const isSingle = Boolean(diagnosisId);

  const dusunList = await prisma.diagnosisBalita.findMany({
    distinct: ["dusun"],
    select: { dusun: true },
    orderBy: { dusun: "asc" },
  });

  // ── SINGLE DIAGNOSIS PRINT ──
  if (isSingle && isPrint) {
    const rec = await prisma.diagnosisBalita.findUnique({
      where: { id: diagnosisId },
      include: {
        penyakit: true,
        diagnosisGejala: { include: { gejala: true }, orderBy: { gejala: { kode: "asc" } } },
        diagnosisRanking: { orderBy: { peringkat: "asc" } },
      },
    });

    if (!rec) {
      return <p className="p-8 font-bold text-slate-500">Data tidak ditemukan.</p>;
    }

    return (
      <section className="min-h-screen bg-white text-slate-900 font-sans print:p-0 print:m-0 print:h-auto print:min-h-0 print:max-h-full">
        <style>{`
          @media print {
            @page { margin: 8mm 10mm; size: A4 portrait; }
            html, body {
              height: 100% !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 10.5px;
              background: #ffffff !important;
            }
            section {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }
          }
          @media screen {
            section { max-width: 800px; margin: 0 auto; padding: 32px 28px; }
          }
        `}</style>
        <PrintTrigger />

        {/* Header */}
        <div className="border-b-[3px] border-slate-800 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-xl font-black tracking-tight leading-tight text-slate-900">Laporan Diagnosis Balita</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">Tanggal Cetak</p>
              <p className="text-xs font-black text-slate-900">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Hasil Diagnosis */}
        <div className={`rounded-lg p-4 mb-4 border-2 ${
          rec.hasilDiagnosis === "Gizi Baik"
            ? "border-emerald-400 text-emerald-950"
            : "border-rose-400 text-rose-950"
        }`} style={{ backgroundColor: rec.hasilDiagnosis === "Gizi Baik" ? "#ecfdf5" : "#fff1f2" }}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#059669" : "#e11d48" }}>
            Hasil Diagnosis
          </p>
          <p className="text-xl font-black tracking-tight" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#065f46" : "#9f1239" }}>
            {rec.hasilDiagnosis}
          </p>
          {rec.keterangan && (
            <p className="mt-1.5 text-[11px] font-semibold leading-snug" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#047857" : "#be123c" }}>
              {rec.keterangan}
            </p>
          )}
        </div>

        {/* Data Balita */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">Data Balita</h2>
          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-xs">
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Balita</p><p className="font-bold text-slate-900">{rec.namaBalita}</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">NIK</p><p className="font-bold text-slate-900">{rec.nik}</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Jenis Kelamin</p><p className="font-bold text-slate-900">{rec.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Ibu</p><p className="font-bold text-slate-900">{rec.namaIbu}</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Dusun</p><p className="font-bold text-slate-900">{rec.dusun}</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Umur</p><p className="font-bold text-slate-900">{rec.umurBulan} bulan</p></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tanggal Periksa</p><p className="font-bold text-slate-900">{dateFormatter.format(rec.tanggal)}</p></div>
          </div>
        </div>

        {/* Pengukuran */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">Pengukuran Antropometri</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border-2 border-blue-200 p-2 text-center" style={{ backgroundColor: "#eff6ff" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Berat Badan</p>
              <p className="text-base font-black text-blue-800">{rec.beratBadan} <span className="text-[10px] font-bold text-blue-500">kg</span></p>
            </div>
            <div className="rounded-lg border-2 border-violet-200 p-2 text-center" style={{ backgroundColor: "#f5f3ff" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-violet-500 mb-0.5">Tinggi Badan</p>
              <p className="text-base font-black text-violet-800">{rec.tinggiBadan} <span className="text-[10px] font-bold text-violet-500">cm</span></p>
            </div>
            {rec.lila !== null && (
              <div className="rounded-lg border-2 border-teal-200 p-2 text-center" style={{ backgroundColor: "#f0fdfa" }}>
                <p className="text-[8px] font-black uppercase tracking-widest text-teal-500 mb-0.5">LiLA</p>
                <p className="text-base font-black text-teal-800">{rec.lila} <span className="text-[10px] font-bold text-teal-500">cm</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Gejala Klinis */}
        {rec.diagnosisGejala.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Gejala Klinis ({rec.diagnosisGejala.length} gejala)
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {rec.diagnosisGejala.map((g) => (
                <div key={g.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px]" style={{ backgroundColor: "#f8fafc" }}>
                  <span className="font-black text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}>{g.gejala.kode}</span>
                  <span className="font-semibold text-slate-700">{g.gejala.nama}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saran Penanganan */}
        {rec.penyakit?.saranPenanganan && (
          <div className="mb-4">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">Saran Penanganan</h2>
            <div className="rounded-lg border-2 border-amber-200 p-3 text-[11px] font-medium text-amber-900 leading-relaxed" style={{ backgroundColor: "#fffbeb" }}>
              {rec.penyakit.saranPenanganan}
            </div>
          </div>
        )}

        {/* Tabel Perhitungan Naive Bayes */}
        {rec.diagnosisRanking.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Perhitungan Naive Bayes
            </h2>
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300" style={{ backgroundColor: "#f1f5f9" }}>
                  <th className="p-2 text-left font-black text-[9px] uppercase tracking-wider text-slate-600">No</th>
                  <th className="p-2 text-left font-black text-[9px] uppercase tracking-wider text-slate-600">Penyakit</th>
                  <th className="p-2 text-right font-black text-[9px] uppercase tracking-wider text-slate-600">Prior</th>
                  <th className="p-2 text-right font-black text-[9px] uppercase tracking-wider text-slate-600">Likelihood</th>
                  <th className="p-2 text-right font-black text-[9px] uppercase tracking-wider text-slate-600">Posterior</th>
                </tr>
              </thead>
              <tbody>
                {rec.diagnosisRanking.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-200" style={{ backgroundColor: i === 0 ? "#f0fdf4" : i % 2 === 1 ? "#f8fafc" : "transparent" }}>
                    <td className="p-2 font-bold text-slate-500">{r.peringkat}</td>
                    <td className="p-2 font-bold text-slate-900">
                      <span className="font-black text-[10px] px-1 py-0.5 rounded mr-1" style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}>{r.kodePenyakit}</span>
                      {r.namaPenyakit}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-700">{r.prior.toFixed(4)}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-700">{r.score.toFixed(10)}</td>
                    <td className="p-2 text-right font-black" style={{ color: i === 0 ? "#059669" : "#64748b" }}>{r.posterior.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-[3px] border-slate-800 pt-3 mt-4">
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
            <p>Sistem Diagnosis Gizi Balita — Metode Naive Bayes</p>
            <p>Dicetak: {dateFormatter.format(new Date())}</p>
          </div>
        </div>
      </section>
    );
  }

  // ── LIST VIEW ──
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { namaBalita: { contains: q } },
      { nik: { contains: q } },
    ];
  }

  if (filterDusun) {
    where.dusun = filterDusun;
  }

  if (filterStatus === "baik") {
    where.hasilDiagnosis = "Gizi Baik";
  } else if (filterStatus === "buruk") {
    where.NOT = { hasilDiagnosis: "Gizi Baik" };
  }

  const totalRecords = await prisma.diagnosisBalita.count({ where });
  const totalPages = isPrint ? 1 : Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const records = await prisma.diagnosisBalita.findMany({
    where,
    include: {
      penyakit: true,
    },
    orderBy: { tanggal: "desc" },
    ...(isPrint ? {} : { skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  });

  const basePath = "/dashboard/riwayat-diagnosis";
  const filterParams = { q, dusun: filterDusun, status: filterStatus };
  const hasFilters = Boolean(q || filterDusun || filterStatus);

  // ── PRINT LIST ──
  if (isPrint) {
    return (
      <section className="min-h-screen bg-white text-slate-900 font-sans print:p-0">
        <style>{`
          @media print {
            @page { margin: 12mm 10mm; size: A4 landscape; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen {
            section { max-width: 1100px; margin: 0 auto; padding: 32px 28px; }
          }
        `}</style>
        <PrintTrigger />

        {/* Header */}
        <div className="border-b-[3px] border-slate-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-2xl font-black tracking-tight leading-tight">Riwayat Diagnosis Balita</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">Tanggal Cetak</p>
              <p className="text-xs font-black">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold mb-5" style={{ backgroundColor: "#f8fafc" }}>
          Menampilkan <span className="font-black">{records.length}</span> dari total <span className="font-black">{totalRecords}</span> data
          {hasFilters && " (dengan filter aktif)"}
        </div>

        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left" style={{ backgroundColor: "#f1f5f9" }}>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">No</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Tanggal</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Nama</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">NIK</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">JK</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Nama Ibu</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Dusun</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Umur</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">BB/TB</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">LiLA</th>
              <th className="p-2.5 font-black text-[10px] uppercase tracking-wider">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-200" style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "transparent" }}>
                <td className="p-2.5 font-semibold text-slate-500">{i + 1}</td>
                <td className="p-2.5">{dateFormatter.format(r.tanggal)}</td>
                <td className="p-2.5 font-bold text-slate-900">{r.namaBalita}</td>
                <td className="p-2.5 font-mono text-[10px]">{r.nik}</td>
                <td className="p-2.5">{r.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</td>
                <td className="p-2.5">{r.namaIbu}</td>
                <td className="p-2.5">{r.dusun}</td>
                <td className="p-2.5">{r.umurBulan} bln</td>
                <td className="p-2.5">{r.beratBadan}/{r.tinggiBadan}</td>
                <td className="p-2.5">{r.lila !== null ? `${r.lila} cm` : "-"}</td>
                <td className="p-2.5 font-bold" style={{ color: r.hasilDiagnosis === "Gizi Baik" ? "#059669" : "#e11d48" }}>{r.hasilDiagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="border-t-[3px] border-slate-800 pt-4 mt-8">
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
            <p>Sistem Diagnosis Gizi Balita — Metode Naive Bayes</p>
            <p>Dicetak: {dateFormatter.format(new Date())}</p>
          </div>
        </div>
      </section>
    );
  }

  // ── NORMAL VIEW ──
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
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Riwayat Diagnosis</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Arsip seluruh diagnosis balita. Gunakan filter untuk pencarian spesifik.
            </p>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden">
        {/* Filter */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Filter Pencarian</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">Temukan riwayat diagnosis balita dengan cepat.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ExportButtons
                printUrl={buildHref(basePath, { ...filterParams, print: "1" })}
              />
            </div>
          </div>

          <form method="get" className="mt-6 grid gap-4 xl:grid-cols-[1fr_180px_180px_auto_auto] xl:items-end border-t border-slate-200 pt-6">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                <Search className="h-3.5 w-3.5 text-primary" /> Nama / NIK
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari nama atau NIK..."
                className="input-field h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Dusun
              </label>
              <select name="dusun" defaultValue={filterDusun} className="input-field h-11 bg-white font-bold cursor-pointer">
                <option value="">Semua Dusun</option>
                {dusunList.map((d) => (
                  <option key={d.dusun} value={d.dusun}>{d.dusun}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                <Filter className="h-3.5 w-3.5 text-primary" /> Status
              </label>
              <select name="status" defaultValue={filterStatus} className="input-field h-11 bg-white font-bold cursor-pointer">
                <option value="">Semua Status</option>
                <option value="baik">Gizi Baik</option>
                <option value="buruk">Gizi Buruk</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl transition-all active:scale-95 px-6 font-bold"
            >
              <Search className="mr-2 h-4 w-4" /> Terapkan
            </button>
            <a
              href={basePath}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </a>
          </form>
        </div>

        {/* Summary */}
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl shadow-sm w-fit">
            <Hash className="h-5 w-5 text-primary" />
            <p className="text-slate-700 font-semibold text-sm">
              Total <span className="font-black text-primary text-base">{totalRecords}</span> data
              {hasFilters && " (terfilter)"}
            </p>
          </div>

          {/* Table */}
          {records.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-slate-200 text-slate-400 mb-6 shadow-sm">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Tidak ada data</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Tidak ada riwayat diagnosis yang cocok dengan filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-50 font-black text-xs uppercase tracking-wider text-slate-700">
                  <tr className="border-b border-slate-200">
                    <th className="h-14 px-5 text-left">Tanggal</th>
                    <th className="h-14 px-5 text-left">Nama Balita</th>
                    <th className="h-14 px-5 text-left">NIK</th>
                    <th className="h-14 px-5 text-center">JK</th>
                    <th className="h-14 px-5 text-left">Nama Ibu</th>
                    <th className="h-14 px-5 text-left">Dusun</th>
                    <th className="h-14 px-5 text-center">Umur</th>
                    <th className="h-14 px-5 text-center">BB/TB</th>
                    <th className="h-14 px-5 text-left">Hasil</th>
                    <th className="h-14 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const isGiziBaik = rec.hasilDiagnosis === "Gizi Baik";
                    return (
                      <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 px-5 font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-slate-400" />
                            {dateFormatter.format(rec.tanggal)}
                          </div>
                        </td>
                        <td className="p-4 px-5 font-black text-slate-900">{rec.namaBalita}</td>
                        <td className="p-4 px-5 font-mono text-xs font-bold text-slate-600">{rec.nik}</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">
                          {rec.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}
                        </td>
                        <td className="p-4 px-5 font-semibold text-slate-700">{rec.namaIbu}</td>
                        <td className="p-4 px-5 font-semibold text-slate-700">{rec.dusun}</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">{rec.umurBulan} bln</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">{rec.beratBadan}/{rec.tinggiBadan}</td>
                        <td className="p-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black border shadow-sm ${
                            isGiziBaik
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {isGiziBaik ? <CheckCircle2 className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                            {rec.hasilDiagnosis}
                          </span>
                        </td>
                        <td className="p-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <ExportButtons
                              printUrl={buildHref(basePath, { diagnosisId: rec.id, print: "1" })}
                              compact
                            />
                            <DeleteDiagnosisButton id={rec.id} namaBalita={rec.namaBalita} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row shadow-sm">
              <p className="text-sm text-slate-500 font-semibold">
                Menampilkan <span className="font-black text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalRecords)}</span> dari <span className="font-black text-slate-900">{totalRecords}</span>
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildHref(basePath, { ...filterParams, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    currentPage <= 1 ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Sebelumnya
                </a>
                <span className="flex h-11 w-11 items-center justify-center font-black text-primary bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                  {currentPage}
                </span>
                <a
                  href={buildHref(basePath, { ...filterParams, page: currentPage + 1 })}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    currentPage >= totalPages ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Selanjutnya <ChevronRight className="ml-1.5 h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
