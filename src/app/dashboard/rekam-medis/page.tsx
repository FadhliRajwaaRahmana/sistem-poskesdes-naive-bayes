import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { computePemantauanStatus, type PemantauanStatus } from "@/lib/diagnosis-helpers";
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
  Activity,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type RekamMedisPageProps = {
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

export default async function RekamMedisPage({ searchParams }: RekamMedisPageProps) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};

  const q = sv(params.q).trim();
  const filterDusun = sv(params.dusun);
  const filterStatus = sv(params.status);
  const pemantauanNik = sv(params.nik);
  const diagnosisId = sv(params.diagnosisId);
  const isPrint = sv(params.print) === "1";
  const requestedPage = pv(params.page);

  const isPemantauan = Boolean(pemantauanNik);
  const isSingle = Boolean(diagnosisId);

  // Get distinct dusun values for filter dropdown
  const dusunList = await prisma.diagnosisBalita.findMany({
    distinct: ["dusun"],
    select: { dusun: true },
    orderBy: { dusun: "asc" },
  });

  // ── PEMANTAUAN VIEW ──
  if (isPemantauan) {
    const records = await prisma.diagnosisBalita.findMany({
      where: { nik: pemantauanNik },
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
              href="/dashboard/rekam-medis"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="size-4" /> Kembali ke Rekam Medis
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
            href={buildHref("/dashboard/rekam-medis", { nik: pemantauanNik, print: "1" })}
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
                          isGiziBaik
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
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

  // ── SINGLE DIAGNOSIS PRINT ──
  if (isSingle && isPrint) {
    const rec = await prisma.diagnosisBalita.findUnique({
      where: { id: diagnosisId },
      include: {
        penyakit: true,
        user: true,
        diagnosisGejala: { include: { gejala: true }, orderBy: { gejala: { kode: "asc" } } },
        diagnosisRanking: { orderBy: { peringkat: "asc" } },
      },
    });

    if (!rec) {
      return <p className="p-8 font-bold text-slate-500">Data tidak ditemukan.</p>;
    }

    return (
      <section className="space-y-6 bg-white text-black print:p-0 font-sans">
        <Script id="print-trigger" strategy="afterInteractive">
          {`window.addEventListener("load",function(){setTimeout(function(){window.print()},300)});`}
        </Script>
        <div className="border-b-2 border-slate-900 pb-5">
          <h1 className="text-3xl font-black tracking-tight">Laporan Diagnosis Balita POSYANDU</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Tanggal Cetak: {dateFormatter.format(new Date())}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Nama Balita</p><p className="font-bold">{rec.namaBalita}</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">NIK</p><p className="font-bold">{rec.nik}</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Jenis Kelamin</p><p className="font-bold">{rec.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Nama Ibu</p><p className="font-bold">{rec.namaIbu}</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Dusun</p><p className="font-bold">{rec.dusun}</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Umur</p><p className="font-bold">{rec.umurBulan} bulan</p></div>
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">BB / TB</p><p className="font-bold">{rec.beratBadan} kg / {rec.tinggiBadan} cm</p></div>
          {rec.lila && <div><p className="font-black text-slate-500 text-xs uppercase mb-1">LiLA</p><p className="font-bold">{rec.lila} cm</p></div>}
          <div><p className="font-black text-slate-500 text-xs uppercase mb-1">Tanggal Periksa</p><p className="font-bold">{dateFormatter.format(rec.tanggal)}</p></div>
          <div><p className="font-black text-primary text-xs uppercase mb-1">Hasil Diagnosis</p><p className="font-black text-lg">{rec.hasilDiagnosis}</p></div>
        </div>

        {rec.keterangan && (
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="font-black text-slate-500 text-xs uppercase mb-1">Keterangan</p>
            <p className="font-semibold text-sm">{rec.keterangan}</p>
          </div>
        )}

        <div>
          <p className="font-black text-slate-500 text-xs uppercase mb-2">Gejala Klinis</p>
          <div className="flex flex-wrap gap-1.5">
            {rec.diagnosisGejala.map((g) => (
              <span key={g.id} className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold">
                {g.gejala.kode} - {g.gejala.nama}
              </span>
            ))}
          </div>
        </div>

        {rec.diagnosisRanking.length > 0 && (
          <div>
            <p className="font-black text-slate-500 text-xs uppercase mb-2">Ranking Probabilitas</p>
            <div className="grid grid-cols-2 gap-3">
              {rec.diagnosisRanking.map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-slate-200 rounded p-2 text-sm">
                  <span className="font-bold">#{r.peringkat} {r.kodePenyakit} - {r.namaPenyakit}</span>
                  <span className="font-black">{r.posterior.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rec.penyakit?.saranPenanganan && (
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="font-black text-slate-500 text-xs uppercase mb-1">Saran Penanganan</p>
            <p className="font-semibold text-sm">{rec.penyakit.saranPenanganan}</p>
          </div>
        )}
      </section>
    );
  }

  // ── LIST VIEW ──
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { namaBalita: { contains: q, mode: "insensitive" } },
      { nik: { contains: q, mode: "insensitive" } },
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
      user: true,
    },
    orderBy: { tanggal: "desc" },
    ...(isPrint ? {} : { skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  });

  const basePath = "/dashboard/rekam-medis";
  const filterParams = { q, dusun: filterDusun, status: filterStatus };
  const hasFilters = Boolean(q || filterDusun || filterStatus);

  // ── PRINT LIST ──
  if (isPrint) {
    return (
      <section className="space-y-6 bg-white text-black print:p-0 font-sans">
        <Script id="print-trigger" strategy="afterInteractive">
          {`window.addEventListener("load",function(){setTimeout(function(){window.print()},300)});`}
        </Script>
        <div className="border-b-2 border-slate-900 pb-5">
          <h1 className="text-3xl font-black tracking-tight">Laporan Rekam Medis POSYANDU</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Tanggal Cetak: {dateFormatter.format(new Date())}</p>
        </div>
        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Menampilkan <span className="font-black">{records.length}</span> dari total <span className="font-black">{totalRecords}</span> data
          {hasFilters && " (dengan filter aktif)"}
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left font-black text-xs uppercase tracking-wider">
              <th className="p-3">No</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Nama</th>
              <th className="p-3">NIK</th>
              <th className="p-3">JK</th>
              <th className="p-3">Nama Ibu</th>
              <th className="p-3">Dusun</th>
              <th className="p-3">Umur</th>
              <th className="p-3">BB/TB</th>
              <th className="p-3">LiLA</th>
              <th className="p-3">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-200">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{dateFormatter.format(r.tanggal)}</td>
                <td className="p-3 font-bold">{r.namaBalita}</td>
                <td className="p-3">{r.nik}</td>
                <td className="p-3">{r.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</td>
                <td className="p-3">{r.namaIbu}</td>
                <td className="p-3">{r.dusun}</td>
                <td className="p-3">{r.umurBulan} bln</td>
                <td className="p-3">{r.beratBadan}/{r.tinggiBadan}</td>
                <td className="p-3">{r.lila !== null ? `${r.lila} cm` : "-"}</td>
                <td className="p-3 font-bold">{r.hasilDiagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Rekam Medis</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Arsip seluruh diagnosis balita. Gunakan filter untuk pencarian spesifik dan klik nama balita untuk pemantauan.
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
              <p className="mt-1 text-sm font-semibold text-slate-500">Temukan rekam medis balita dengan cepat.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={buildHref(basePath, { ...filterParams, print: "1" })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" /> Cetak
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
              <p className="mt-2 text-sm text-slate-500 font-medium">Tidak ada rekam medis yang cocok dengan filter.</p>
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
                    <th className="h-14 px-5 text-center">LiLA</th>
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
                        <td className="p-4 px-5">
                          <Link
                            href={buildHref(basePath, { nik: rec.nik })}
                            className="font-black text-primary hover:underline"
                          >
                            {rec.namaBalita}
                          </Link>
                        </td>
                        <td className="p-4 px-5 font-mono text-xs font-bold text-slate-600">{rec.nik}</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">
                          {rec.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}
                        </td>
                        <td className="p-4 px-5 font-semibold text-slate-700">{rec.namaIbu}</td>
                        <td className="p-4 px-5 font-semibold text-slate-700">{rec.dusun}</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">{rec.umurBulan} bln</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">{rec.beratBadan}/{rec.tinggiBadan}</td>
                        <td className="p-4 px-5 text-center font-bold text-slate-700">{rec.lila !== null ? `${rec.lila} cm` : "-"}</td>
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
                          <Link
                            href={buildHref(basePath, { diagnosisId: rec.id, print: "1" })}
                            target="_blank"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary active:scale-95 transition-all"
                          >
                            <Printer className="size-3.5" /> Cetak
                          </Link>
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
