import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { DeleteDiagnosisButton } from "./delete-button";
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
      },
    });

    if (!rec) {
      return <p className="p-8 font-bold text-slate-500">Data tidak ditemukan.</p>;
    }

    return (
      <section className="min-h-screen bg-white text-slate-900 font-sans print:p-0">
        <style>{`
          @media print {
            @page { margin: 15mm 12mm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen {
            section { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener("load",function(){setTimeout(function(){window.print()},400)});` }} />

        {/* Header */}
        <div className="border-b-[3px] border-slate-900 pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-[28px] font-black tracking-tight leading-tight">Laporan Diagnosis Balita</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-500">Tanggal Cetak</p>
              <p className="text-sm font-black">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Hasil Diagnosis */}
        <div className={`rounded-xl p-6 mb-8 border-2 ${
          rec.hasilDiagnosis === "Gizi Baik"
            ? "bg-emerald-50 border-emerald-300"
            : "bg-rose-50 border-rose-300"
        }`}>
          <p className="text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#047857" : "#be123c" }}>
            Hasil Diagnosis
          </p>
          <p className="text-3xl font-black tracking-tight" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#065f46" : "#9f1239" }}>
            {rec.hasilDiagnosis}
          </p>
          {rec.keterangan && (
            <p className="mt-3 text-sm font-semibold leading-relaxed" style={{ color: rec.hasilDiagnosis === "Gizi Baik" ? "#065f46" : "#9f1239" }}>
              {rec.keterangan}
            </p>
          )}
        </div>

        {/* Data Balita */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 pb-2 border-b border-slate-200">Data Balita</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Balita</p><p className="font-bold text-slate-900">{rec.namaBalita}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">NIK</p><p className="font-bold text-slate-900">{rec.nik}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Jenis Kelamin</p><p className="font-bold text-slate-900">{rec.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Ibu</p><p className="font-bold text-slate-900">{rec.namaIbu}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Dusun</p><p className="font-bold text-slate-900">{rec.dusun}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Umur</p><p className="font-bold text-slate-900">{rec.umurBulan} bulan</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tanggal Periksa</p><p className="font-bold text-slate-900">{dateFormatter.format(rec.tanggal)}</p></div>
          </div>
        </div>

        {/* Pengukuran */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 pb-2 border-b border-slate-200">Pengukuran Antropometri</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Berat Badan</p>
              <p className="text-2xl font-black text-slate-900">{rec.beratBadan} <span className="text-sm font-bold text-slate-500">kg</span></p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tinggi Badan</p>
              <p className="text-2xl font-black text-slate-900">{rec.tinggiBadan} <span className="text-sm font-bold text-slate-500">cm</span></p>
            </div>
            {rec.lila !== null && (
              <div className="rounded-lg border border-slate-200 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">LiLA</p>
                <p className="text-2xl font-black text-slate-900">{rec.lila} <span className="text-sm font-bold text-slate-500">cm</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Gejala Klinis */}
        {rec.diagnosisGejala.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 pb-2 border-b border-slate-200">
              Gejala Klinis ({rec.diagnosisGejala.length} gejala)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {rec.diagnosisGejala.map((g) => (
                <div key={g.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-black text-primary">{g.gejala.kode}</span>
                  <span className="font-semibold text-slate-700">{g.gejala.nama}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saran Penanganan */}
        {rec.penyakit?.saranPenanganan && (
          <div className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 pb-2 border-b border-slate-200">Saran Penanganan</h2>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{rec.penyakit.saranPenanganan}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-slate-900 pt-6 mt-12">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
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
            @page { margin: 15mm 10mm; size: A4 landscape; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen {
            section { max-width: 1100px; margin: 0 auto; padding: 40px 32px; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener("load",function(){setTimeout(function(){window.print()},400)});` }} />

        {/* Header */}
        <div className="border-b-[3px] border-slate-900 pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-[28px] font-black tracking-tight leading-tight">Riwayat Diagnosis Balita</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-500">Tanggal Cetak</p>
              <p className="text-sm font-black">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold mb-6">
          Menampilkan <span className="font-black">{records.length}</span> dari total <span className="font-black">{totalRecords}</span> data
          {hasFilters && " (dengan filter aktif)"}
        </div>

        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">No</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Tanggal</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Nama</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">NIK</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">JK</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Nama Ibu</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Dusun</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Umur</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">BB/TB</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">LiLA</th>
              <th className="p-2 font-black text-[10px] uppercase tracking-wider">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-200">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{dateFormatter.format(r.tanggal)}</td>
                <td className="p-2 font-bold">{r.namaBalita}</td>
                <td className="p-2">{r.nik}</td>
                <td className="p-2">{r.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</td>
                <td className="p-2">{r.namaIbu}</td>
                <td className="p-2">{r.dusun}</td>
                <td className="p-2">{r.umurBulan} bln</td>
                <td className="p-2">{r.beratBadan}/{r.tinggiBadan}</td>
                <td className="p-2">{r.lila !== null ? `${r.lila} cm` : "-"}</td>
                <td className="p-2 font-bold">{r.hasilDiagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 pt-6 mt-12">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
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
              <a
                href={buildHref(basePath, { ...filterParams, print: "1" })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Printer className="h-4.5 w-4.5" /> Cetak / PDF
              </a>
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
                            <Link
                              href={buildHref(basePath, { diagnosisId: rec.id, print: "1" })}
                              target="_blank"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary active:scale-95 transition-all"
                            >
                              <Printer className="size-3.5" /> Cetak
                            </Link>
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
