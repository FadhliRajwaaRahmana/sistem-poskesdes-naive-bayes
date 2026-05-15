import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { createUser, updateUser, resetUserPassword, deleteUser } from "@/actions/user-management";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type PenggunaPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const PAGE_SIZE = 10;

function sv(v: string | string[] | undefined) {
  return typeof v === "string" ? v : "";
}

function pv(v: string | string[] | undefined) {
  if (typeof v !== "string") return 1;
  const p = Number.parseInt(v, 10);
  return Number.isNaN(p) || p < 1 ? 1 : p;
}

function flash(v: string | string[] | undefined) {
  return typeof v === "string" ? v : null;
}

function buildHref(q: string, page: number) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const s = query.toString();
  return s ? `/dashboard/pengguna?${s}` : "/dashboard/pengguna";
}

export default async function PenggunaPage({ searchParams }: PenggunaPageProps) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};

  const q = sv(params.q).trim();
  const requestedPage = pv(params.page);
  const successMessage = flash(params.success);
  const errorMessage = flash(params.error);

  const where = {
    role: "USER" as const,
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { username: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const totalUsers = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const userList = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

  return (
    <section className="animate-fade-in space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Kelola Pengguna</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Kelola akun pengguna (orangtua/ibu) yang dapat mengakses sistem untuk melakukan diagnosis balita.
            </p>
          </div>
        </div>
      </div>

      {/* Flash Messages */}
      {successMessage && (
        <div className="animate-slide-up flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-emerald-100 p-2 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-emerald-800">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="animate-slide-up flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-2 border border-rose-200">
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-800">{errorMessage}</span>
        </div>
      )}

      {/* Add Form */}
      <div className="animate-slide-up stagger-1 card-container">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl border border-primary/20">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Pengguna Baru</h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Buat akun untuk orangtua/ibu balita.</p>
          </div>
        </div>
        <form action={createUser} className="grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-3 md:items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              placeholder="Nama orangtua/ibu"
              className="input-field h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Mis. ibu_budi"
              className="input-field h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 6 karakter"
              className="input-field h-12"
              required
            />
          </div>
          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 w-full md:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Buat Akun
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      <div className="animate-slide-up stagger-2 card-container !p-0 overflow-hidden flex flex-col">
        {/* List Header + Search */}
        <div className="border-b border-slate-200 p-6 lg:p-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Daftar Pengguna</h3>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Total <span className="font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">{totalUsers}</span> pengguna &bull; Halaman <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages}
            </p>
          </div>
          <form method="get" className="flex flex-col gap-3 sm:flex-row w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari nama atau username..."
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
                  href="/dashboard/pengguna"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white border border-slate-200 px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                >
                  Reset
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Users */}
        <div className="p-4 sm:p-6 bg-slate-50/30">
          {userList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 mb-5 shadow-sm">
                <UserCircle className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {q ? "Pencarian Tidak Ditemukan" : "Belum Ada Pengguna"}
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-md leading-relaxed">
                {q
                  ? "Coba gunakan kata kunci lain."
                  : "Belum ada akun pengguna. Buat akun pertama menggunakan form di atas."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {userList.map((user, index) => (
                <div
                  key={user.id}
                  className={`animate-slide-up stagger-${Math.min(index + 1, 8)} bg-white p-5 border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-slate-300`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* User Info + Edit Name */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-sm border border-teal-100">
                          <UserCircle className="size-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{user.name}</p>
                          <p className="text-xs font-semibold text-slate-500">
                            @{user.username} &bull; Dibuat: {dateFormatter.format(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <form action={updateUser} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <input type="hidden" name="id" value={user.id} />
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                          <input
                            type="text"
                            name="name"
                            defaultValue={user.name ?? ""}
                            className="input-field h-10 font-bold"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-700 border border-emerald-200 shadow-sm transition-all hover:bg-emerald-100 active:scale-95"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Simpan
                        </button>
                      </form>
                    </div>

                    {/* Actions: Reset Password + Delete */}
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:shrink-0 lg:pl-4 lg:border-l border-slate-100 pt-4 lg:pt-0 border-t lg:border-t-0">
                      <form action={resetUserPassword} className="flex gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <input
                          type="password"
                          name="password"
                          placeholder="Password baru"
                          className="input-field h-10 w-40 text-sm"
                          required
                          minLength={6}
                        />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 border border-amber-200 shadow-sm transition-all hover:bg-amber-100 active:scale-95 shrink-0"
                        >
                          <KeyRound className="mr-1.5 h-4 w-4" /> Reset
                        </button>
                      </form>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 border border-rose-200 shadow-sm transition-all hover:bg-rose-100 active:scale-95"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row">
            <p className="text-sm font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalUsers)}</span> dari <span className="font-bold text-slate-800">{totalUsers}</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href={buildHref(q, currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-10 items-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage <= 1 ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black border border-primary/20">
                {currentPage}
              </span>
              <a
                href={buildHref(q, currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-10 items-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  currentPage >= totalPages ? "pointer-events-none opacity-50 text-slate-400" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Selanjutnya <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
