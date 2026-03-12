import { createGejala, deleteGejala, updateGejala } from "@/actions/master-data";
import { prisma } from "@/lib/prisma";
import {
  Thermometer,
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

type GejalaPageProps = {
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
  return queryString ? `/dashboard/gejala?${queryString}` : "/dashboard/gejala";
}

export default async function GejalaPage({ searchParams }: GejalaPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = getSearchValue(params.q).trim();
  const requestedPage = getPageValue(params.page);

  const gejalaWhere = q
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
        ],
      }
    : {};

  const totalGejala = await prisma.gejala.count({ where: gejalaWhere });
  const totalPages = Math.max(1, Math.ceil(totalGejala / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const gejalaList = await prisma.gejala.findMany({
    where: gejalaWhere,
    orderBy: { kode: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const successMessage = getFlashMessage(params.success);
  const errorMessage = getFlashMessage(params.error);

  return (
    <section className="animate-fade-in space-y-6">
      {/* Page Header - Hero Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-8 text-white shadow-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/10 p-3 text-white backdrop-blur-sm">
            <Thermometer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Data Gejala</h2>
            <p className="text-slate-300 mt-1">
              Kelola daftar gejala yang akan dipakai pada data training dan proses diagnosa.
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
          <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      ) : null}

      {/* Add Form */}
      <div className="card-container p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-slate-100 text-slate-700 p-2.5 rounded-xl border border-slate-200">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Tambah Gejala</h3>
        </div>
        <form
          action={createGejala}
          className="flex flex-col gap-4 md:flex-row md:items-start"
        >
          <div className="w-full md:w-48">
            <input
              type="text"
              name="kode"
              placeholder="Kode, mis. G08"
              className="input-field"
              required
            />
          </div>
          <div className="w-full md:flex-1">
            <input
              type="text"
              name="nama"
              placeholder="Nama gejala"
              className="input-field"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Simpan
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="card-container p-6 lg:p-8 space-y-6">
        {/* List Header + Search */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Daftar Gejala</h3>
            <p className="mt-1 text-sm text-slate-500">
              Total <span className="font-bold text-primary">{totalGejala}</span> gejala &bull; Halaman <span className="font-bold text-primary">{currentPage}</span> dari <span className="font-bold text-primary">{totalPages}</span>
            </p>
          </div>

          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari gejala..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
              >
                Cari
              </button>
              <a
                href="/dashboard/gejala"
                className="inline-flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"
              >
                Reset
              </a>
            </div>
          </form>
        </div>

        {/* List / Empty State */}
        {gejalaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border-2 border-slate-200 mb-4">
              <Thermometer className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {q ? "Tidak ditemukan" : "Belum ada data"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              {q
                ? "Tidak ada gejala yang cocok dengan pencarian Anda."
                : "Belum ada data gejala. Tambahkan gejala pertama di atas."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col border-2 border-slate-100 rounded-2xl overflow-hidden">
            {gejalaList.map((gejala, index) => (
              <div
                key={gejala.id}
                className={`animate-slide-up stagger-${Math.min(index + 1, 8)} bg-white p-4 border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50`}
              >
                <form
                  action={updateGejala}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <input type="hidden" name="id" value={gejala.id} />
                  <div className="w-full sm:w-32">
                    <input
                      type="text"
                      name="kode"
                      defaultValue={gejala.kode}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      name="nama"
                      defaultValue={gejala.nama}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="flex gap-2 sm:shrink-0 mt-2 sm:mt-0">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Simpan
                    </button>
                    <button
                      type="submit"
                      formAction={deleteGejala}
                      className="inline-flex items-center justify-center rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-bold text-slate-800">{Math.min(currentPage * PAGE_SIZE, totalGejala)}</span> dari <span className="font-bold text-slate-800">{totalGejala}</span> data
            </p>
            <div className="flex items-center gap-2">
              <a
                href={buildPageHref(q, currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm ${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold border-2 border-primary/20">
                {currentPage}
              </span>
              <a
                href={buildPageHref(q, currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm ${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Berikutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
