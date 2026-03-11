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
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Data Gejala</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola daftar gejala yang akan dipakai pada data training dan proses diagnosa.
        </p>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Add Form */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Tambah Gejala</h3>
          </div>
        </div>
        <div className="p-6">
          <form
            action={createGejala}
            className="flex flex-col gap-4 md:flex-row md:items-start"
          >
            <div className="w-full md:w-48">
              <input
                type="text"
                name="kode"
                placeholder="Kode, mis. G08"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="w-full md:flex-1">
              <input
                type="text"
                name="nama"
                placeholder="Nama gejala"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Simpan
            </button>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4 rounded-xl border border-border bg-card shadow-sm">
        {/* List Header + Search */}
        <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Daftar Gejala</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Total {totalGejala} gejala &bull; Halaman {currentPage} dari {totalPages}
            </p>
          </div>

          <form method="get" className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari gejala..."
                className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
              >
                Cari
              </button>
              <a
                href="/dashboard/gejala"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </a>
            </div>
          </form>
        </div>

        {/* List / Empty State */}
        {gejalaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Thermometer className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {q ? "Tidak ditemukan" : "Belum ada data"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {q
                ? "Tidak ada gejala yang cocok dengan pencarian Anda."
                : "Belum ada data gejala. Tambahkan gejala pertama di atas."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {gejalaList.map((gejala, index) => (
              <div
                key={gejala.id}
                className={`animate-slide-up stagger-${Math.min(index + 1, 8)} border-b border-border p-4 transition-colors hover:bg-muted/50 last:border-0 sm:px-6`}
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
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      name="nama"
                      defaultValue={gejala.nama}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Simpan
                    </button>
                    <button
                      type="submit"
                      formAction={deleteGejala}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-100 hover:text-rose-700"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
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
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border p-4 sm:flex-row sm:px-6">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-medium text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-medium text-foreground">{Math.min(currentPage * PAGE_SIZE, totalGejala)}</span> dari <span className="font-medium text-foreground">{totalGejala}</span> data
            </p>
            <div className="flex items-center gap-2">
              <a
                href={buildPageHref(q, currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Sebelumnya
              </a>
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium">
                {currentPage}
              </span>
              <a
                href={buildPageHref(q, currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Berikutnya
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
