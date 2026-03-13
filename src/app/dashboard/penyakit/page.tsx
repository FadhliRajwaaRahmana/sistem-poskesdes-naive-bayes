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
    <section className="animate-fade-in space-y-8 pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <Bug className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Data Penyakit</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Kelola master data penyakit yang akan menjadi target klasifikasi sistem Naive Bayes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Flash Messages ── */}
      {successMessage ? (
        <div className="animate-slide-down flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-emerald-100 p-2 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-emerald-800">{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-slide-down flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-2 border border-rose-200">
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-800">{errorMessage}</span>
        </div>
      ) : null}

      {/* ── Add Form Section ── */}
      <div className="animate-slide-up stagger-1 card-container">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-rose-100 text-rose-600 p-3 rounded-xl border border-rose-200">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Tambah Penyakit Baru
            </h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Isi detail penyakit beserta deskripsinya.</p>
          </div>
        </div>

        <form action={createPenyakit} className="grid gap-6 border-t border-slate-100 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
                Kode Penyakit
              </label>
              <input
                type="text"
                name="kode"
                placeholder="Contoh: P01"
                className="input-field h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
                Nama Penyakit
              </label>
              <input
                type="text"
                name="nama"
                placeholder="Masukkan nama penyakit"
                className="input-field h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
              Deskripsi Medis{" "}
              <span className="font-normal text-slate-400 capitalize normal-case tracking-normal">(Opsional)</span>
            </label>
            <textarea
              name="deskripsi"
              placeholder="Jelaskan secara singkat mengenai penyakit ini..."
              className="input-field min-h-[100px] resize-y"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Simpan Penyakit
            </button>
          </div>
        </form>
      </div>

      {/* ── List Section ── */}
      <div className="animate-slide-up stagger-2 card-container !p-0 overflow-hidden flex flex-col">
        {/* List Header + Search */}
        <div className="border-b border-slate-200 p-6 lg:p-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Daftar Penyakit Tersimpan
            </h3>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Total <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md">{totalPenyakit}</span> penyakit • Halaman <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages}
            </p>
          </div>

          <form method="get" className="flex w-full items-center gap-2 lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari penyakit…"
                className="input-field pl-11 h-11 lg:w-72"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
            >
              Cari
            </button>
            {q && (
              <a
                href="/dashboard/penyakit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white border border-slate-200 px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              >
                Reset
              </a>
            )}
          </form>
        </div>

        {/* List Items / Empty State */}
        <div className="p-4 lg:p-6 bg-slate-50/30">
          {penyakitList.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white">
              <div className="flex h-20 w-20 items-center justify-center bg-slate-100 border border-slate-200 rounded-3xl mb-5 shadow-sm">
                <Bug className="h-10 w-10 text-slate-400" />
              </div>
              <p className="text-lg font-black text-slate-800">
                {q ? "Penyakit Tidak Ditemukan" : "Belum Ada Data Penyakit"}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-md leading-relaxed">
                {q
                  ? "Coba gunakan kata kunci lain untuk mencari penyakit yang Anda butuhkan."
                  : "Mulai tambahkan data penyakit baru menggunakan form di atas."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {penyakitList.map((penyakit, idx) => (
                <div
                  key={penyakit.id}
                  className={`animate-slide-up stagger-${Math.min(idx + 1, 8)} flex flex-col xl:flex-row xl:items-start gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:border-primary/30 group`}
                >
                  <div className="flex-1 w-full">
                    <form action={updatePenyakit} id={`update-form-${penyakit.id}`} className="grid gap-5">
                      <input type="hidden" name="id" value={penyakit.id} />

                      <div className="grid gap-5 md:grid-cols-[140px_1fr]">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Kode
                          </label>
                          <input
                            type="text"
                            name="kode"
                            defaultValue={penyakit.kode}
                            className="input-field h-11 font-bold text-rose-600"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Nama Penyakit
                          </label>
                          <input
                            type="text"
                            name="nama"
                            defaultValue={penyakit.nama}
                            className="input-field h-11 font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Deskripsi Medis
                        </label>
                        <textarea
                          name="deskripsi"
                          defaultValue={penyakit.deskripsi ?? ""}
                          className="input-field min-h-[60px] resize-y text-sm leading-relaxed"
                          placeholder="Deskripsi singkat..."
                        />
                      </div>
                    </form>
                  </div>

                  <div className="flex sm:flex-row xl:flex-col items-center gap-2 pt-4 xl:pt-6 xl:pl-6 xl:border-l border-slate-100 mt-2 xl:mt-0 border-t xl:border-t-0">
                    <button
                      type="submit"
                      form={`update-form-${penyakit.id}`}
                      className="inline-flex h-11 w-full xl:w-32 items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-xl px-4 text-sm font-bold transition-all active:scale-95 shadow-sm"
                      title="Simpan Perubahan"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Simpan
                    </button>
                    <form action={deletePenyakit} className="w-full xl:w-32">
                      <input type="hidden" name="id" value={penyakit.id} />
                      <button
                        type="submit"
                        className="inline-flex h-11 w-full items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl px-4 text-sm font-bold transition-all active:scale-95 shadow-sm"
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
          <div className="border-t border-slate-200 bg-slate-50 p-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500">
                Menampilkan{" "}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, totalPenyakit)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-800">
                  {totalPenyakit}
                </span>{" "}
                data
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildPageHref(q, currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50 border-slate-200 bg-slate-50 text-slate-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Sebelumnya
                </a>
                <div className="flex h-10 w-10 items-center justify-center bg-primary/10 border border-primary/20 text-primary rounded-xl font-black shadow-sm">
                  {currentPage}
                </div>
                <a
                  href={buildPageHref(q, currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50 border-slate-200 bg-slate-50 text-slate-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Selanjutnya
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
