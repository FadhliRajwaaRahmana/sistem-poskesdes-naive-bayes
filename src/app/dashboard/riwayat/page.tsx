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
      <section className="space-y-6 bg-white text-black print:p-0">
        <Script id="riwayat-print-trigger" strategy="afterInteractive">
          {`window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });`}
        </Script>

        {/* Print header */}
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold tracking-tight">
            {isSingleDiagnosa
              ? "Laporan Diagnosa Pasien"
              : "Laporan Riwayat Diagnosa"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tanggal cetak: {dateFormatter.format(new Date())}
          </p>
        </div>

        {/* Print summary */}
        <div className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm">
          Menampilkan <span className="font-semibold">{riwayat.length}</span>{" "}
          data
          {isSingleDiagnosa
            ? " diagnosa individu."
            : hasFilters
              ? ` sesuai filter aktif. Total keseluruhan ${totalRiwayat} data.`
              : ` dari total ${totalRiwayat} riwayat diagnosa.`}
        </div>

        {filterBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center text-xs font-medium text-muted-foreground">
              Filter aktif:
            </span>
            {filterBadges.map((item) => (
              <span
                key={item}
                className="rounded-md border border-border px-2 py-0.5 text-xs font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {/* Print cards */}
        {riwayat.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Tidak ada riwayat diagnosa yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className="space-y-6">
            {riwayat.map((item, index) => {
              const listIndex =
                isSingleDiagnosa || isPrintMode
                  ? index + 1
                  : totalRiwayat - (currentPage - 1) * PAGE_SIZE - index;

              return (
                <article
                  key={item.id}
                  className="rounded-md border border-border p-6 break-inside-avoid-page"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isSingleDiagnosa
                          ? "Diagnosa Pasien"
                          : `Riwayat #${listIndex}`}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        {item.namaPasien}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pemeriksaan: {dateFormatter.format(item.tanggal)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        ID: {item.id}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs">
                      Diproses oleh:{" "}
                      <span className="font-medium">{item.user.name}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        No. Kartu
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {item.noKartu ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Umur
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {item.umur} tahun
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Hasil
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {item.hasilDiagnosa}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Penyakit Terkait
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {item.penyakit?.nama ?? "Tidak diketahui"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Alamat
                    </p>
                    <p className="mt-1 text-sm">{item.alamat ?? "-"}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Gejala
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.diagnosaGejala.map((gejalaItem) => (
                        <span
                          key={gejalaItem.id}
                          className="rounded-md border border-border px-2 py-0.5 text-xs font-medium"
                        >
                          {gejalaItem.gejala.kode} - {gejalaItem.gejala.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.keterangan && (
                    <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Keterangan
                      </p>
                      <p className="mt-1 text-sm">{item.keterangan}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      Snapshot Ranking Probabilitas
                    </p>
                    {item.diagnosaRanking.length > 0 ? (
                      <div className="space-y-2">
                        {item.diagnosaRanking.map((rankingItem) => (
                          <div
                            key={rankingItem.id}
                            className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                          >
                            <span className="font-medium">
                              #{rankingItem.peringkat}{" "}
                              {rankingItem.kodePenyakit} -{" "}
                              {rankingItem.namaPenyakit}
                            </span>
                            <span className="font-bold">
                              {(rankingItem.posterior * 100).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border py-3 text-center text-sm text-muted-foreground">
                        Ranking snapshot belum tersedia.
                      </div>
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
    <section className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="stagger-1 animate-slide-up bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center gap-5 shadow-sm">
        <div className="bg-white/10 p-3 rounded-2xl w-fit">
          <ClipboardList className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Riwayat Diagnosa
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Riwayat semua pasien yang pernah diproses di sistem beserta
            gejala, hasil diagnosa, keterangannya, dan snapshot ranking
            probabilitas.
          </p>
        </div>
      </div>

      <div className="card-container p-6 lg:p-8 print:shadow-none print:border-none print:bg-transparent print:p-0">
        {/* ── Filter Section ── */}
        {!isSingleDiagnosa ? (
          <div className="stagger-2 animate-slide-up print:hidden mb-8 border-b border-slate-200 pb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Filter Riwayat
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Filter berdasarkan nama pasien, penyakit, dan rentang
                    tanggal pemeriksaan.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={printAllHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Semua
                </a>
                <a
                  href={printFilteredHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Hasil Filter
                </a>
              </div>
            </div>

            <form
              method="get"
              className="mt-6 grid gap-4 xl:grid-cols-[1fr_220px_170px_170px_auto_auto] xl:items-end"
            >
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <Search className="h-4 w-4 text-indigo-500" />
                  Nama pasien
                </label>
                <input
                  type="text"
                  name="namaPasien"
                  defaultValue={namaPasien}
                  placeholder="Cari nama pasien..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Penyakit
                </label>
                <select
                  name="penyakitId"
                  defaultValue={penyakitId}
                  className="input-field"
                >
                  <option value="">Semua penyakit</option>
                  {penyakitList.map((penyakit) => (
                    <option key={penyakit.id} value={penyakit.id}>
                      {penyakit.kode} - {penyakit.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Tanggal mulai
                </label>
                <input
                  type="date"
                  name="tanggalMulai"
                  defaultValue={tanggalMulai}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Tanggal selesai
                </label>
                <input
                  type="date"
                  name="tanggalSelesai"
                  defaultValue={tanggalSelesai}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-[42px] items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl transition-colors px-5 font-semibold"
              >
                <Search className="mr-2 h-4 w-4" />
                Terapkan
              </button>

              <a
                href="/dashboard/riwayat"
                className="inline-flex h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 transition-all"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </a>
            </form>
          </div>
        ) : null}

        {/* ── Summary Bar ── */}
        <div className="stagger-3 animate-slide-up flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm mb-6 print:mb-0 shadow-sm">
          <Hash className="h-5 w-5 text-indigo-600" />
          <p className="text-slate-600 font-medium">
            Menampilkan{" "}
            <span className="font-bold text-slate-900">
              {riwayat.length}
            </span>{" "}
            data
            {isSingleDiagnosa
              ? " diagnosa individu."
              : hasFilters
                ? ` sesuai filter aktif. Total keseluruhan ${totalRiwayat} data.`
                : ` dari total ${totalRiwayat} riwayat diagnosa.`}
          </p>
        </div>

        {/* ── Active Filter Badges ── */}
        {filterBadges.length > 0 ? (
          <div className="stagger-4 animate-slide-up flex flex-wrap gap-2 print:hidden mb-6">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              Filter aktif:
            </span>
            {filterBadges.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {/* ── History Cards ── */}
        {riwayat.length === 0 ? (
          <div className="stagger-4 animate-slide-up rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4 shadow-sm">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Tidak ada riwayat ditemukan
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto font-medium">
              Tidak ada riwayat diagnosa yang cocok dengan filter saat ini. Coba
              sesuaikan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className="stagger-4 animate-slide-up bg-white border-2 border-slate-100 p-6 rounded-2xl mb-4 shadow-sm hover:border-slate-300 transition-colors break-inside-avoid-page"
                >
                  {/* Card header */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-5 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {isSingleDiagnosa
                            ? "Diagnosa Pasien"
                            : `Riwayat #${listIndex}`}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          <Hash className="h-3 w-3" />
                          {item.id}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                        {item.namaPasien}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {dateFormatter.format(item.tanggal)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        Oleh:{" "}
                        <span className="font-bold text-slate-900">
                          {item.user.name}
                        </span>
                      </div>
                      <Link
                        href={printSingleHref}
                        target="_blank"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 active:scale-95"
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        Cetak
                      </Link>
                    </div>
                  </div>

                  {/* Patient info grid */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-5">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        No. Kartu
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.noKartu ?? "-"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Umur
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.umur} tahun
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                        Hasil Diagnosa
                      </p>
                      <div className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
                        {item.hasilDiagnosa}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Penyakit Terkait
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {item.penyakit?.nama ?? "Tidak diketahui"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Alamat
                    </p>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {item.alamat ?? "-"}
                    </p>
                  </div>

                  {/* Gejala badges */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Gejala yang Dipilih
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.diagnosaGejala.map((gejalaItem) => (
                        <span
                          key={gejalaItem.id}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                        >
                          <span className="font-bold text-indigo-600 mr-1.5">
                            {gejalaItem.gejala.kode}
                          </span>
                          {gejalaItem.gejala.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keterangan */}
                  {item.keterangan && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                        Keterangan Tambahan
                      </p>
                      <p className="text-sm font-medium text-amber-900 leading-relaxed">
                        {item.keterangan}
                      </p>
                    </div>
                  )}

                  {/* Ranking snapshot */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Snapshot Ranking Probabilitas
                    </p>
                    {item.diagnosaRanking.length > 0 ? (
                      <div className="grid gap-2 lg:grid-cols-2">
                        {item.diagnosaRanking.map((rankingItem) => (
                          <div
                            key={rankingItem.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm shadow-sm ${
                                  rankingItem.peringkat === 1
                                    ? "bg-indigo-600 text-white"
                                    : rankingItem.peringkat === 2
                                      ? "bg-indigo-400 text-white"
                                      : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {rankingItem.peringkat}
                              </span>
                              <span className="font-bold text-sm text-slate-800">
                                <span className="text-indigo-600 mr-1.5">
                                  {rankingItem.kodePenyakit}
                                </span>
                                {rankingItem.namaPenyakit}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-500 font-mono font-medium">
                                <span>
                                  Prior: {rankingItem.prior.toFixed(3)}
                                </span>
                                <span>
                                  Score: {rankingItem.score.toExponential(2)}
                                </span>
                              </div>
                              <span className="inline-flex items-center rounded-lg bg-indigo-100 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-800">
                                {(rankingItem.posterior * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-medium text-slate-500">
                        Ranking snapshot belum tersedia untuk data diagnosa ini.
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
          <div className="stagger-5 animate-slide-up mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row shadow-sm">
            <p className="text-sm text-slate-600 font-medium">
              Menampilkan{" "}
              <span className="font-bold text-slate-900">
                {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, totalRiwayat)}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-slate-900">{totalRiwayat}</span>{" "}
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
                className={`inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 active:scale-95 ${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Sebelumnya
              </a>
              <span className="flex h-10 items-center justify-center px-4 text-sm font-bold text-slate-700 bg-white rounded-xl border border-slate-200 shadow-sm">
                Page {currentPage} of {totalPages}
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
                className={`inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 active:scale-95 ${
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
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
    </section>
  );
}

