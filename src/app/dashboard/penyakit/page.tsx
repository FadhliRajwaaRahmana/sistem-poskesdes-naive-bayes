import { createPenyakit, deletePenyakit, updatePenyakit } from "@/actions/master-data";
import { prisma } from "@/lib/prisma";
import {
  Bug,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type PenyakitPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const PAGE_SIZE = 10;

function getFlashMessage(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getPageValue(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function buildPageHref(q: string, page: number) {
  const query = new URLSearchParams();

  if (q) {
    query.set("q", q);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return queryString ? `/dashboard/penyakit?${queryString}` : "/dashboard/penyakit";
}

export default async function PenyakitPage({ searchParams }: PenyakitPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = getSearchValue(params.q).trim();
  const requestedPage = getPageValue(params.page);

  const penyakitWhere = q
    ? {
        OR: [
          {
            kode: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
          {
            nama: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
          {
            deskripsi: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const totalPenyakit = await prisma.penyakit.count({ where: penyakitWhere });
  const totalPages = Math.max(1, Math.ceil(totalPenyakit / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const penyakitList = await prisma.penyakit.findMany({
    where: penyakitWhere,
    orderBy: { kode: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const successMessage = getFlashMessage(params.success);
  const errorMessage = getFlashMessage(params.error);

  return (
    <section className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 rounded-2xl bg-slate-900 p-6 lg:p-8 text-white shadow-lg mb-6">
        <div className="bg-white/10 p-3 rounded-2xl">
          <Bug className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Data Penyakit</h2>
          <p className="mt-1 text-sm text-slate-300 max-w-2xl">
            Kelola daftar penyakit yang akan menjadi target klasifikasi Naive Bayes.
          </p>
        </div>
      </div>

      {/* ── Flash Messages ── */}
      {successMessage ? (
        <div className="animate-slide-down flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-slide-down flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
          <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      ) : null}

      {/* ── Add Form Section ── */}
      <div className="animate-slide-up stagger-1 card-container p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Tambah Penyakit Baru
          </h3>
        </div>

        <form action={createPenyakit} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Kode Penyakit
              </label>
              <input
                type="text"
                name="kode"
                placeholder="Contoh: P06"
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Nama Penyakit
              </label>
              <input
                type="text"
                name="nama"
                placeholder="Masukkan nama penyakit"
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Deskripsi{" "}
              <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              name="deskripsi"
              placeholder="Deskripsi singkat penyakit"
              className="input-field min-h-[100px] resize-y"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Simpan Penyakit
            </button>
          </div>
        </form>
      </div>

      {/* ── List Section ── */}
      <div className="animate-slide-up stagger-2 card-container overflow-hidden flex flex-col">
        {/* List Header + Search */}
        <div className="border-b border-slate-200 p-6 lg:p-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Daftar Penyakit
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Total <span className="font-medium text-slate-700">{totalPenyakit}</span> penyakit • Halaman <span className="font-medium text-slate-700">{currentPage}</span> dari {totalPages}
            </p>
          </div>

          <form method="get" className="flex w-full items-center gap-3 lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari penyakit…"
                className="input-field pl-10 lg:w-72"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95"
            >
              Cari
            </button>
            {q && (
              <a
                href="/dashboard/penyakit"
                className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95"
              >
                Reset
              </a>
            )}
          </form>
        </div>

        {/* List Items / Empty State */}
        <div className="p-4 lg:p-6 bg-slate-50/50">
          {penyakitList.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Bug className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">
                {q ? "Penyakit tidak ditemukan" : "Belum ada data penyakit"}
              </p>
              <p className="mt-2 text-sm text-slate-500 max-w-sm">
                {q
                  ? "Coba gunakan kata kunci lain untuk mencari penyakit yang Anda butuhkan."
                  : "Mulai tambahkan data penyakit baru menggunakan form di atas."}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {penyakitList.map((penyakit, idx) => (
                <div
                  key={penyakit.id}
                  className={`animate-slide-up stagger-${Math.min(idx + 1, 8)} flex flex-col sm:flex-row sm:items-start gap-4 bg-white p-6 border border-slate-200 shadow-sm mb-3 rounded-xl transition-all hover:shadow-md hover:border-slate-300 group`}
                >
                  <div className="flex-1 w-full">
                    <form action={updatePenyakit} id={`update-form-${penyakit.id}`} className="grid gap-4">
                      <input type="hidden" name="id" value={penyakit.id} />

                      <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                            Kode
                          </label>
                          <input
                            type="text"
                            name="kode"
                            defaultValue={penyakit.kode}
                            className="input-field"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                            Nama Penyakit
                          </label>
                          <input
                            type="text"
                            name="nama"
                            defaultValue={penyakit.nama}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Deskripsi
                        </label>
                        <textarea
                          name="deskripsi"
                          defaultValue={penyakit.deskripsi ?? ""}
                          className="input-field min-h-[40px] resize-y"
                          placeholder="Deskripsi singkat..."
                        />
                      </div>
                    </form>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-6 sm:pl-6 sm:border-l sm:border-slate-100">
                    <button
                      type="submit"
                      form={`update-form-${penyakit.id}`}
                      className="inline-flex w-full sm:w-auto items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 shadow-sm"
                      title="Simpan Perubahan"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Simpan
                    </button>
                    <form action={deletePenyakit} className="w-full sm:w-auto">
                      <input type="hidden" name="id" value={penyakit.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full sm:w-auto items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 shadow-sm"
                        title="Hapus Penyakit"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 bg-slate-50 p-5 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Menampilkan{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, totalPenyakit)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-700">
                  {totalPenyakit}
                </span>{" "}
                data
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildPageHref(q, currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all active:scale-95 ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50 border-slate-200 bg-slate-50 text-slate-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  Sebelumnya
                </a>
                <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 shadow-sm min-w-[3rem]">
                  {currentPage}
                </div>
                <a
                  href={buildPageHref(q, currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all active:scale-95 ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50 border-slate-200 bg-slate-50 text-slate-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Selanjutnya
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
