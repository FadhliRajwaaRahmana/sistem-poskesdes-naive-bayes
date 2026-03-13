import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import {
  ClipboardList,
  Search,
  Filter,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Hash,
  FileText,
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

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getPrintMode(value: string | string[] | undefined) {
  return typeof value === "string" && value === "1";
}

function getPageValue(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function buildQueryString(filters: {
  diagnosaId?: string;
  namaPasien?: string;
  penyakitId?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  page?: number;
  print?: boolean;
}) {
  const query = new URLSearchParams();

  if (filters.diagnosaId) {
    query.set("diagnosaId", filters.diagnosaId);
  }

  if (filters.namaPasien) {
    query.set("namaPasien", filters.namaPasien);
  }

  if (filters.penyakitId) {
    query.set("penyakitId", filters.penyakitId);
  }

  if (filters.tanggalMulai) {
    query.set("tanggalMulai", filters.tanggalMulai);
  }

  if (filters.tanggalSelesai) {
    query.set("tanggalSelesai", filters.tanggalSelesai);
  }

  if (filters.page && filters.page > 1) {
    query.set("page", String(filters.page));
  }

  if (filters.print) {
    query.set("print", "1");
  }

  const queryString = query.toString();
  return queryString
    ? `/dashboard/riwayat?${queryString}`
    : "/dashboard/riwayat";
}

export default async function RiwayatPage({ searchParams }: RiwayatPageProps) {
  const params = searchParams ? await searchParams : {};
  const diagnosaId = getSearchValue(params.diagnosaId);
  const namaPasien = getSearchValue(params.namaPasien).trim();
  const penyakitId = getSearchValue(params.penyakitId);
  const tanggalMulai = getSearchValue(params.tanggalMulai);
  const tanggalSelesai = getSearchValue(params.tanggalSelesai);
  const requestedPage = getPageValue(params.page);
  const isPrintMode = getPrintMode(params.print);

  const startDate = parseDateInput(tanggalMulai);
  const endDate = parseDateInput(tanggalSelesai);
  const isSingleDiagnosa = Boolean(diagnosaId);
  const hasFilters = Boolean(
    diagnosaId || namaPasien || penyakitId || startDate || endDate,
  );

  const riwayatWhere = {
    ...(diagnosaId
      ? {
          id: diagnosaId,
        }
      : {}),
    ...(namaPasien
      ? {
          namaPasien: {
            contains: namaPasien,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(penyakitId
      ? {
          penyakitId,
        }
      : {}),
    ...(startDate || endDate
      ? {
          tanggal: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lt: addOneDay(endDate) } : {}),
          },
        }
      : {}),
  };

  const [totalRiwayat, penyakitList] = await Promise.all([
    prisma.diagnosaPasien.count({ where: riwayatWhere }),
    prisma.penyakit.findMany({
      orderBy: {
        kode: "asc",
      },
    }),
  ]);

  const totalPages =
    isSingleDiagnosa || isPrintMode
      ? 1
      : Math.max(1, Math.ceil(totalRiwayat / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const riwayat = await prisma.diagnosaPasien.findMany({
    where: riwayatWhere,
    include: {
      penyakit: true,
      user: true,
      diagnosaGejala: {
        include: {
          gejala: true,
        },
        orderBy: {
          gejala: {
            kode: "asc",
          },
        },
      },
      diagnosaRanking: {
        orderBy: {
          peringkat: "asc",
        },
      },
    },
    orderBy: {
      tanggal: "desc",
    },
    ...(isSingleDiagnosa || isPrintMode
      ? {}
      : {
          skip: (currentPage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
  });

  const selectedPenyakitName =
    penyakitList.find((item) => item.id === penyakitId)?.nama ??
    "Tidak diketahui";

  const filterBadges = [
    diagnosaId ? `ID Diagnosa: ${diagnosaId}` : null,
    namaPasien ? `Nama: ${namaPasien}` : null,
    penyakitId ? `Penyakit: ${selectedPenyakitName}` : null,
    tanggalMulai ? `Dari: ${tanggalMulai}` : null,
    tanggalSelesai ? `Sampai: ${tanggalSelesai}` : null,
  ].filter(Boolean);

  const printAllHref = buildQueryString({ print: true });
  const printFilteredHref = buildQueryString({
    namaPasien,
    penyakitId,
    tanggalMulai,
    tanggalSelesai,
    print: true,
  });

  /* ───────────────── PRINT MODE LAYOUT ───────────────── */
  if (isPrintMode) {
    return (
      <section className="space-y-6 bg-white text-black print:p-0 font-sans">
        <Script id="riwayat-print-trigger" strategy="afterInteractive">
          {`window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });`}
        </Script>

        {/* Print header */}
        <div className="border-b-2 border-slate-900 pb-5">
          <h1 className="text-3xl font-black tracking-tight">
            {isSingleDiagnosa
              ? "Laporan Diagnosa Pasien POSKESDES"
              : "Laporan Riwayat Diagnosa POSKESDES"}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Tanggal Cetak: {dateFormatter.format(new Date())}
          </p>
        </div>

        {/* Print summary */}
        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Menampilkan <span className="font-black text-slate-900">{riwayat.length}</span>{" "}
          data
          {isSingleDiagnosa
            ? " diagnosa individu."
            : hasFilters
              ? ` sesuai filter aktif. Total keseluruhan ${totalRiwayat} data.`
              : ` dari total ${totalRiwayat} riwayat diagnosa.`}
        </div>

        {filterBadges.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filter Aktif:</span>
            {filterBadges.map((item) => (
              <span key={item} className="rounded border border-slate-300 px-2 py-0.5 text-xs font-bold">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {/* Print cards */}
        {riwayat.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-sm font-bold text-slate-500">
            Tidak ada riwayat diagnosa yang cocok.
          </div>
        ) : (
          <div className="space-y-8">
            {riwayat.map((item, index) => {
              const listIndex =
                isSingleDiagnosa || isPrintMode
                  ? index + 1
                  : totalRiwayat - (currentPage - 1) * PAGE_SIZE - index;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border-2 border-slate-200 p-6 break-inside-avoid-page bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {isSingleDiagnosa ? "Detail Pasien" : `Data #${listIndex}`}
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-slate-900">
                        {item.namaPasien}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Diperiksa: {dateFormatter.format(item.tanggal)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-mono font-bold text-slate-400">
                        ID: {item.id}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                      Oleh: <span className="text-slate-900">{item.user.name}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Kartu</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{item.noKartu ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Umur</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{item.umur} Tahun</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Hasil Diagnosa</p>
                      <p className="mt-1 text-lg font-black text-primary">{item.hasilDiagnosa}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Penyakit Terkait</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{item.penyakit?.nama ?? "Tidak diketahui"}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alamat</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.alamat ?? "-"}</p>
                  </div>

                  <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Gejala Klinis</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.diagnosaGejala.map((gejalaItem) => (
                        <span key={gejalaItem.id} className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800">
                          {gejalaItem.gejala.kode} - {gejalaItem.gejala.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.keterangan && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Keterangan Tambahan</p>
                      <p className="text-sm font-semibold text-slate-800">{item.keterangan}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Ranking Probabilitas</p>
                    {item.diagnosaRanking.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {item.diagnosaRanking.map((rankingItem) => (
                          <div key={rankingItem.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                            <span className="font-bold text-slate-800">
                              #{rankingItem.peringkat} {rankingItem.kodePenyakit}
                            </span>
                            <span className="font-black text-slate-900">
                              {(rankingItem.posterior * 100).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-slate-400">Ranking tidak tersedia.</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  /* ───────────────── NORMAL MODE LAYOUT ───────────────── */
  return (
    <section className="animate-fade-in space-y-8 pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <ClipboardList className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Riwayat Diagnosa</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Arsip seluruh proses diagnosa pasien. Gunakan filter untuk pencarian spesifik dan cetak hasil jika diperlukan.
            </p>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden print:shadow-none print:border-none print:bg-transparent print:p-0">
        {/* ── Filter Section ── */}
        {!isSingleDiagnosa ? (
          <div className="stagger-2 animate-slide-up print:hidden border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Filter Pencarian</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Temukan rekam medis pasien dengan cepat.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={printAllHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Semua
                </a>
                <a
                  href={printFilteredHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-primary active:scale-95 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Filter
                </a>
              </div>
            </div>

            <form
              method="get"
              className="mt-6 grid gap-4 xl:grid-cols-[1fr_220px_170px_170px_auto_auto] xl:items-end border-t border-slate-200 pt-6"
            >
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Nama Pasien
                </label>
                <input
                  type="text"
                  name="namaPasien"
                  defaultValue={namaPasien}
                  placeholder="Cari..."
                  className="input-field h-11 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Penyakit
                </label>
                <select
                  name="penyakitId"
                  defaultValue={penyakitId}
                  className="input-field h-11 bg-white font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">Semua Penyakit</option>
                  {penyakitList.map((penyakit) => (
                    <option key={penyakit.id} value={penyakit.id}>
                      {penyakit.kode} - {penyakit.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Mulai
                </label>
                <input
                  type="date"
                  name="tanggalMulai"
                  defaultValue={tanggalMulai}
                  className="input-field h-11 bg-white font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Selesai
                </label>
                <input
                  type="date"
                  name="tanggalSelesai"
                  defaultValue={tanggalSelesai}
                  className="input-field h-11 bg-white font-bold text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl transition-all active:scale-95 px-6 font-bold"
              >
                <Search className="mr-2 h-4 w-4" />
                Terapkan
              </button>

              <a
                href="/dashboard/riwayat"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-primary active:scale-95 transition-all"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </a>
            </form>
          </div>
        ) : null}

        {/* ── Summary & Badges ── */}
        <div className="p-6 lg:p-8 space-y-6">
          <div className="stagger-3 animate-slide-up flex items-center justify-between">
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl shadow-sm">
              <Hash className="h-5 w-5 text-primary" />
              <p className="text-slate-700 font-semibold text-sm">
                Menampilkan <span className="font-black text-primary text-base">{riwayat.length}</span> data
              </p>
            </div>

            {filterBadges.length > 0 && (
              <div className="stagger-4 animate-slide-up flex items-center gap-2 print:hidden overflow-x-auto no-scrollbar">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                {filterBadges.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── History Cards ── */}
          {riwayat.length === 0 ? (
            <div className="stagger-4 animate-slide-up rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-slate-200 text-slate-400 mb-6 shadow-sm">
                <ClipboardList className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Tidak ada riwayat ditemukan
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto font-medium">
                Tidak ada riwayat diagnosa yang cocok dengan filter saat ini. Coba
                sesuaikan parameter pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {riwayat.map((item, index) => {
                const listIndex =
                  isSingleDiagnosa || isPrintMode
                    ? index + 1
                    : totalRiwayat - (currentPage - 1) * PAGE_SIZE - index;
                const printSingleHref = buildQueryString({
                  diagnosaId: item.id,
                  print: true,
                });

                return (
                  <article
                    key={item.id}
                    className="stagger-4 animate-slide-up bg-white border border-slate-200 p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 break-inside-avoid-page group"
                  >
                    {/* Card header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-6 mb-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white shadow-sm">
                            {isSingleDiagnosa ? "DETAIL PASIEN" : `DATA #${listIndex}`}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Hash className="h-3.5 w-3.5" />
                            {item.id.substring(0, 8)}...
                          </span>
                        </div>
                        <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                          {item.namaPasien}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {dateFormatter.format(item.tanggal)}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:flex-col lg:items-end xl:flex-row">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm">
                          <User className="h-4 w-4 text-slate-400" />
                          Oleh: <span className="text-slate-900">{item.user.name}</span>
                        </div>
                        <Link
                          href={printSingleHref}
                          target="_blank"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-primary hover:text-primary active:scale-95"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Cetak Laporan
                        </Link>
                      </div>
                    </div>

                    {/* Patient info grid */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. Kartu</p>
                        <p className="text-base font-bold text-slate-900">{item.noKartu ?? "-"}</p>
                      </div>
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Umur</p>
                        <p className="text-base font-bold text-slate-900">{item.umur} Tahun</p>
                      </div>
                      <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 transition-colors hover:bg-primary/10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Hasil Diagnosa</p>
                        <div className="inline-flex items-center rounded-lg bg-primary px-3 py-1 text-sm font-black text-white shadow-sm">
                          {item.hasilDiagnosa}
                        </div>
                      </div>
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Penyakit Terkait</p>
                        <p className="text-base font-bold text-slate-900 truncate" title={item.penyakit?.nama}>{item.penyakit?.nama ?? "Tidak diketahui"}</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                      {/* Address */}
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Pasien</p>
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {item.alamat ?? "-"}
                        </p>
                      </div>
                      
                      {/* Keterangan */}
                      {item.keterangan && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-inner">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">
                            Keterangan Tambahan
                          </p>
                          <p className="text-sm font-bold text-amber-900 leading-relaxed">
                            {item.keterangan}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Gejala badges */}
                    <div className="mb-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Gejala Klinis yang Ditemukan
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.diagnosaGejala.map((gejalaItem) => (
                          <span
                            key={gejalaItem.id}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm"
                          >
                            <span className="font-black text-primary mr-2">
                              {gejalaItem.gejala.kode}
                            </span>
                            {gejalaItem.gejala.nama}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ranking snapshot */}
                    <div className="pt-6 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Snapshot Ranking Probabilitas
                      </p>
                      {item.diagnosaRanking.length > 0 ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                          {item.diagnosaRanking.map((rankingItem) => (
                            <div
                              key={rankingItem.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm hover:border-primary/30 hover:bg-white transition-all duration-300"
                            >
                              <div className="flex items-center gap-3.5">
                                <span
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shadow-sm ${
                                    rankingItem.peringkat === 1
                                      ? "bg-primary text-white"
                                      : rankingItem.peringkat === 2
                                        ? "bg-slate-300 text-slate-800"
                                        : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  #{rankingItem.peringkat}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <span className={`font-black text-sm ${rankingItem.peringkat === 1 ? "text-primary" : "text-slate-900"}`}>
                                    {rankingItem.namaPenyakit}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {rankingItem.kodePenyakit}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-400 font-mono font-bold">
                                  <span>Prior: {rankingItem.prior.toFixed(3)}</span>
                                  <span>Score: {rankingItem.score.toExponential(2)}</span>
                                </div>
                                <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-black shadow-sm ${
                                  rankingItem.peringkat === 1 
                                    ? "bg-primary/10 border-primary/20 text-primary" 
                                    : "bg-white border-slate-200 text-slate-700"
                                }`}>
                                  {(rankingItem.posterior * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                          Ranking snapshot tidak tersedia untuk data diagnosa ini.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {!isSingleDiagnosa && !isPrintMode && totalPages > 1 ? (
            <div className="stagger-5 animate-slide-up mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row shadow-sm">
              <p className="text-sm text-slate-500 font-semibold">
                Menampilkan{" "}
                <span className="font-black text-slate-900">
                  {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, totalRiwayat)}
                </span>{" "}
                dari{" "}
                <span className="font-black text-slate-900">{totalRiwayat}</span>{" "}
                hasil
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildQueryString({
                    namaPasien,
                    penyakitId,
                    tanggalMulai,
                    tanggalSelesai,
                    page: currentPage - 1,
                  })}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 ${
                    currentPage <= 1 ? "pointer-events-none opacity-50 text-slate-400" : ""
                  }`}
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  Sebelumnya
                </a>
                <span className="flex h-11 w-11 items-center justify-center text-sm font-black text-primary bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                  {currentPage}
                </span>
                <a
                  href={buildQueryString({
                    namaPasien,
                    penyakitId,
                    tanggalMulai,
                    tanggalSelesai,
                    page: currentPage + 1,
                  })}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50 text-slate-400"
                      : ""
                  }`}
                >
                  Berikutnya
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
