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
    <section className="animate-fade-in space-y-8 pb-10">
      {/* Page Header - Hero Banner */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <Thermometer className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Data Gejala</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Kelola daftar gejala master. Data ini akan digunakan sebagai parameter utama dalam proses diagnosa pasien.
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="animate-slide-up flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-emerald-100 p-2 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-emerald-800">{successMessage}</span>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="animate-slide-up flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-2 border border-rose-200">
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-800">{errorMessage}</span>
        </div>
      ) : null}

      {/* Add Form */}
      <div className="animate-slide-up stagger-1 card-container">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl border border-primary/20">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Gejala Baru</h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Masukkan kode unik dan nama gejala.</p>
          </div>
        </div>
        <form
          action={createGejala}
          className="flex flex-col gap-5 md:flex-row md:items-end border-t border-slate-100 pt-6"
        >
          <div className="w-full md:w-56 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Kode</label>
            <input
              type="text"
              name="kode"
              placeholder="Mis. G01"
              className="input-field h-12"
              required
            />
          </div>
          <div className="w-full md:flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Nama Gejala</label>
            <input
              type="text"
              name="nama"
              placeholder="Masukkan nama gejala"
              className="input-field h-12"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 w-full md:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Simpan Gejala
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="animate-slide-up stagger-2 card-container !p-0 overflow-hidden flex flex-col">
        {/* List Header + Search */}
        <div className="border-b border-slate-200 p-6 lg:p-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Daftar Gejala Tersimpan</h3>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Total <span className="font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">{totalGejala}</span> data &bull; Halaman <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages}
            </p>
          </div>

          <form method="get" className="flex flex-col gap-3 sm:flex-row w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari kode atau nama..."
                className="input-field pl-11 h-11"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
              >
                Cari
              </button>
              {q && (
                <a
                  href="/dashboard/gejala"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white border border-slate-200 px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"
                >
                  Reset
                </a>
              )}
            </div>
          </form>
        </div>

        {/* List / Empty State */}
        <div className="p-4 sm:p-6 bg-slate-50/30">
          {gejalaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 mb-5 shadow-sm">
                <Thermometer className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {q ? "Pencarian Tidak Ditemukan" : "Belum Ada Data Gejala"}
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-md leading-relaxed">
                {q
                  ? "Coba gunakan kata kunci lain untuk mencari data yang Anda inginkan."
                  : "Sistem belum memiliki data gejala. Silakan tambahkan gejala pertama melalui form di atas."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {gejalaList.map((gejala, index) => (
                <div
                  key={gejala.id}
                  className={`animate-slide-up stagger-${Math.min(index + 1, 8)} bg-white p-5 border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-slate-300`}
                >
                  <form
                    action={updateGejala}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="id" value={gejala.id} />
                    <div className="w-full sm:w-32">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 sm:hidden">Kode</label>
                      <input
                        type="text"
                        name="kode"
                        defaultValue={gejala.kode}
                        className="input-field h-11 font-bold text-primary"
                        required
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 sm:hidden">Nama Gejala</label>
                      <input
                        type="text"
                        name="nama"
                        defaultValue={gejala.nama}
                        className="input-field h-11 font-bold"
                        required
                      />
                    </div>
                    <div className="flex gap-2 sm:shrink-0 mt-2 sm:mt-0 sm:pl-4 sm:border-l border-slate-100">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-700 border border-emerald-200 shadow-sm transition-all hover:bg-emerald-100 active:scale-95"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Simpan
                      </button>
                      <button
                        type="submit"
                        formAction={deleteGejala}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 border border-rose-200 shadow-sm transition-all hover:bg-rose-100 active:scale-95"
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
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row">
            <p className="text-sm font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-bold text-slate-800">{Math.min(currentPage * PAGE_SIZE, totalGejala)}</span> dari <span className="font-bold text-slate-800">{totalGejala}</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href={buildPageHref(q, currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage <= 1 ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black border border-primary/20">
                {currentPage}
              </span>
              <a
                href={buildPageHref(q, currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage >= totalPages ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                Selanjutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
