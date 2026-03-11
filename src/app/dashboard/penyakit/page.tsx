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
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Data Penyakit</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola daftar penyakit yang akan menjadi target klasifikasi Naive Bayes.
        </p>
      </div>

      {/* ── Flash Messages ── */}
      {successMessage ? (
        <div className="animate-slide-down flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-slide-down flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* ── Add Form Section ── */}
      <div className="animate-slide-up stagger-1 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">
            Tambah Penyakit
          </h3>
        </div>

        <form action={createPenyakit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Kode Penyakit
              </label>
              <input
                type="text"
                name="kode"
                placeholder="Contoh: P06"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nama Penyakit
              </label>
              <input
                type="text"
                name="nama"
                placeholder="Masukkan nama penyakit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Deskripsi{" "}
              <span className="font-normal text-muted-foreground">(opsional)</span>
            </label>
            <textarea
              name="deskripsi"
              placeholder="Deskripsi singkat penyakit"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Simpan Penyakit
            </button>
          </div>
        </form>
      </div>

      {/* ── List Section ── */}
      <div className="animate-slide-up stagger-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* List Header + Search */}
        <div className="border-b border-border p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-muted/20">
          <div>
            <h3 className="text-base font-medium text-foreground">
              Daftar Penyakit
            </h3>
            <p className="text-sm text-muted-foreground">
              Total {totalPenyakit} penyakit • Halaman {currentPage} dari {totalPages}
            </p>
          </div>

          <form method="get" className="flex w-full items-center gap-2 lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari penyakit…"
                className="flex h-9 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-64"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
            >
              Cari
            </button>
            {q && (
              <a
                href="/dashboard/penyakit"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </a>
            )}
          </form>
        </div>

        {/* List Items / Empty State */}
        <div className="divide-y divide-border">
          {penyakitList.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Bug className="mb-4 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {q ? "Tidak ditemukan" : "Belum ada data"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {q
                  ? "Tidak ada penyakit yang cocok dengan pencarian."
                  : "Belum ada data penyakit. Silakan tambah melalui form di atas."}
              </p>
            </div>
          ) : (
            penyakitList.map((penyakit, idx) => (
              <div
                key={penyakit.id}
                className={`animate-slide-up stagger-${Math.min(idx + 1, 8)} p-4 sm:p-6 transition-colors hover:bg-muted/50`}
              >
                <div className="flex flex-col gap-4">
                  <form action={updatePenyakit} id={`update-form-${penyakit.id}`} className="grid gap-4">
                    <input type="hidden" name="id" value={penyakit.id} />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                          Kode
                        </label>
                        <input
                          type="text"
                          name="kode"
                          defaultValue={penyakit.kode}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                          Nama Penyakit
                        </label>
                        <input
                          type="text"
                          name="nama"
                          defaultValue={penyakit.nama}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">
                        Deskripsi
                      </label>
                      <textarea
                        name="deskripsi"
                        defaultValue={penyakit.deskripsi ?? ""}
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Deskripsi singkat penyakit"
                      />
                    </div>
                  </form>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      form={`update-form-${penyakit.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Update
                    </button>
                    <form action={deletePenyakit}>
                      <input type="hidden" name="id" value={penyakit.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, totalPenyakit)}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-foreground">
                  {totalPenyakit}
                </span>{" "}
                data
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildPageHref(q, currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex h-8 items-center justify-center rounded-md border border-input px-3 text-sm font-medium shadow-sm transition-colors ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Sebelumnya
                </a>
                <span className="text-sm font-medium text-foreground px-2">
                  {currentPage} <span className="text-muted-foreground">/</span> {totalPages}
                </span>
                <a
                  href={buildPageHref(q, currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex h-8 items-center justify-center rounded-md border border-input px-3 text-sm font-medium shadow-sm transition-colors ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  Berikutnya
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
