import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hasAdminRole } from "@/lib/session-guards";
import {
  ClipboardCheck,
  HeartPulse,
  Baby,
  FileText,
  ArrowRight,
  Stethoscope,
  Calculator,
  TrendingUp,
  Zap,
  BarChart3,
  ActivitySquare,
} from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const isAdmin = hasAdminRole(session.user.role);

  const userFilter = isAdmin ? {} : { userId: session.user.id };

  const [
    totalGejala,
    totalPenyakit,
    totalDiagnosis,
    totalBalita,
    latestDiagnosis,
    diagnosisByResult,
    recentDiagnosis,
  ] = await Promise.all([
    prisma.gejala.count(),
    prisma.penyakit.count(),
    prisma.diagnosisBalita.count({ where: userFilter }),
    prisma.diagnosisBalita.findMany({
      where: userFilter,
      select: { nik: true },
      distinct: ["nik"],
    }).then((r) => r.length),
    prisma.diagnosisBalita.findFirst({
      where: userFilter,
      orderBy: { createdAt: "desc" },
      include: { penyakit: true },
    }),
    prisma.diagnosisBalita.groupBy({
      by: ["hasilDiagnosis"],
      where: userFilter,
      _count: { hasilDiagnosis: true },
      orderBy: { _count: { hasilDiagnosis: "desc" } },
      take: 5,
    }),
    prisma.diagnosisBalita.findMany({
      where: userFilter,
      take: 5,
      orderBy: { tanggal: "desc" },
      include: {
        penyakit: true,
        user: true,
        diagnosisGejala: {
          include: { gejala: true },
          orderBy: { gejala: { kode: "asc" } },
        },
      },
    }),
  ]);

  const today = new Date();
  const sevenDayBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: shortDateFormatter.format(date),
      value: 0,
    };
  });

  const sevenDayMap = new Map(sevenDayBuckets.map((item) => [item.key, item]));

  const recentWeekDiagnosis = await prisma.diagnosisBalita.findMany({
    where: {
      ...userFilter,
      tanggal: { gte: new Date(`${sevenDayBuckets[0]?.key}T00:00:00.000Z`) },
    },
    select: { tanggal: true },
  });

  for (const item of recentWeekDiagnosis) {
    const key = item.tanggal.toISOString().slice(0, 10);
    const bucket = sevenDayMap.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  }

  const maxWeeklyDiagnosis = Math.max(...sevenDayBuckets.map((item) => item.value), 1);
  const topResultCount = diagnosisByResult[0]?._count.hasilDiagnosis ?? 0;

  const stats = [
    { label: "Total Gejala", value: totalGejala, hint: "Gejala klinis terdaftar", icon: ClipboardCheck, href: isAdmin ? "/dashboard/gejala" : "/dashboard/diagnosis", color: "text-secondary bg-secondary/10 border-secondary/20" },
    { label: "Total Penyakit", value: totalPenyakit, hint: "Klasifikasi gizi buruk", icon: HeartPulse, href: isAdmin ? "/dashboard/penyakit" : "/dashboard/diagnosis", color: "text-rose-600 bg-rose-100 border-rose-200" },
    { label: "Total Balita", value: totalBalita, hint: "Balita unik (NIK)", icon: Baby, href: isAdmin ? "/dashboard/rekam-medis" : "/dashboard/riwayat", color: "text-amber-600 bg-amber-100 border-amber-200" },
    { label: "Total Diagnosis", value: totalDiagnosis, hint: "Riwayat pemeriksaan", icon: FileText, href: isAdmin ? "/dashboard/rekam-medis" : "/dashboard/riwayat", color: "text-emerald-600 bg-emerald-100 border-emerald-200" },
  ];

  const riwayatHref = isAdmin ? "/dashboard/rekam-medis" : "/dashboard/riwayat";

  return (
    <section className="space-y-6 pb-10">
      {/* Hero Banner */}
      <div className="animate-fade-in relative flex flex-col gap-8 overflow-hidden rounded-[2rem] bg-slate-900 p-8 shadow-xl sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-4 backdrop-blur-md">
            <ActivitySquare className="size-4" />
            <span>{isAdmin ? "Dashboard Admin" : "Dashboard"}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Sistem Diagnosis Gizi Buruk
          </h2>
          <p className="mt-3 text-base font-medium text-slate-300 max-w-lg leading-relaxed">
            {isAdmin
              ? "Pantau data statistik POSYANDU secara real-time. Kelola penyakit, gejala, dan evaluasi diagnosis gizi buruk balita dengan metode Naive Bayes."
              : "Lakukan diagnosis gizi balita dan pantau riwayat pemeriksaan anak Anda."}
          </p>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-3 sm:max-w-sm lg:w-auto lg:min-w-[250px] shrink-0">
          <Link
            href="/dashboard/diagnosis"
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-primary to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            <Stethoscope className="size-5 shrink-0 text-white" />
            <span className="text-white">Mulai Diagnosis Baru</span>
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/perhitungan"
              className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20 active:scale-95"
            >
              <Calculator className="size-5 shrink-0 text-white" />
              <span className="text-white">Detail Perhitungan</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`stagger-${index + 1} card-container group animate-slide-up block hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex size-12 items-center justify-center rounded-2xl border shadow-sm ${item.color} transition-transform group-hover:scale-110`}>
                  <Icon className="size-6" />
                </div>
                <div className="text-4xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                  {item.value}
                </div>
              </div>
              <div className="mt-6">
                <p className="font-bold text-slate-700">{item.label}</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">{item.hint}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Activity Chart */}
        <div className="animate-slide-up stagger-5 col-span-4 card-container flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-primary shadow-sm">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Aktivitas 7 Hari</h3>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">Intensitas diagnosis balita per hari</p>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-7 items-end gap-3 sm:gap-6 h-[260px] p-2">
            {sevenDayBuckets.map((item) => (
              <div key={item.key} className="group flex flex-col items-center gap-3 h-full justify-end">
                <div className="text-sm font-black text-slate-400 group-hover:text-primary transition-colors">
                  {item.value > 0 ? item.value : ""}
                </div>
                <div className="w-full rounded-t-xl rounded-b-sm bg-slate-100 transition-all duration-500 ease-out group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] relative overflow-hidden"
                  style={{
                    height: `${Math.max((item.value / maxWeeklyDiagnosis) * 100, item.value > 0 ? 12 : 4)}%`,
                    backgroundColor: item.value > 0 ? 'var(--primary)' : undefined,
                  }}
                >
                  {item.value > 0 && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>}
                </div>
                <div className="text-center text-xs font-bold text-slate-500 mt-2">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-6 flex flex-col">
          {/* Top Results */}
          <div className="animate-slide-up stagger-6 card-container flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-secondary shadow-sm">
                <TrendingUp className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Top Hasil</h3>
                <p className="text-sm font-semibold text-slate-500 mt-0.5">Hasil diagnosis terbanyak</p>
              </div>
            </div>

            {diagnosisByResult.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400">
                Data belum tersedia.
              </div>
            ) : (
              <div className="space-y-6">
                {diagnosisByResult.map((item) => {
                  const count = item._count.hasilDiagnosis;
                  const width = topResultCount > 0 ? (count / topResultCount) * 100 : 0;

                  return (
                    <div key={item.hasilDiagnosis} className="space-y-3 group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-800">{item.hasilDiagnosis}</span>
                        <span className="font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg border border-secondary/20 shadow-sm">{count} kasus ({totalDiagnosis > 0 ? formatPercentage((count / totalDiagnosis) * 100) : "0%"})</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-secondary to-blue-400 transition-all duration-1000 ease-out"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* System Info */}
          <div className="animate-slide-up stagger-7 card-container">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shadow-sm">
                <Zap className="size-5" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Info Sistem</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 hover:border-slate-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Diagnosis Terakhir</p>
                <div className="font-bold text-slate-900 text-sm">
                  {latestDiagnosis ? (
                    <div className="flex items-center gap-2">
                      <span className="block max-w-[120px] truncate">{latestDiagnosis.namaBalita}</span>
                      <ArrowRight className="size-3 shrink-0 text-slate-400" />
                      <span className="block truncate text-primary">{latestDiagnosis.hasilDiagnosis}</span>
                    </div>
                  ) : (
                    "Belum ada diagnosis."
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 hover:border-slate-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Basis Pengetahuan</p>
                <p className="font-bold text-slate-900 text-sm">
                  {totalPenyakit > 0
                    ? <><span className="text-emerald-600">{totalPenyakit} Penyakit</span> dengan {totalGejala} Gejala</>
                    : "Data Kosong."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Diagnoses List */}
      <div className="animate-slide-up stagger-8 card-container !p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-6 sm:p-8 bg-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <div className="flex size-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm">
              <FileText className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Riwayat Terkini</h3>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">5 diagnosis balita terakhir</p>
            </div>
          </div>
          <Link
            href={riwayatHref}
            className="mt-4 sm:mt-0 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-white text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:border-primary hover:text-primary hover:shadow-md transition-all active:scale-95"
          >
            Lihat Semua
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>

        <div className="p-6 sm:p-8">
          {recentDiagnosis.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400">
              Belum ada riwayat diagnosis.
            </div>
          ) : (
            <div className="space-y-4">
              {recentDiagnosis.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors">{item.namaBalita}</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      {dateFormatter.format(item.tanggal)} <span className="mx-2 text-slate-300">•</span> {item.dusun}
                    </p>
                    <div className="mt-3">
                       <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold border ${
                         item.hasilDiagnosis === "Gizi Baik"
                           ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                           : "bg-primary/10 border-primary/20 text-slate-700"
                       }`}>
                          Hasil: <span className={`ml-1.5 ${item.hasilDiagnosis === "Gizi Baik" ? "text-emerald-600" : "text-primary"}`}>{item.hasilDiagnosis}</span>
                       </span>
                    </div>
                  </div>
                  <div className="flex max-w-sm flex-wrap gap-2">
                    {item.diagnosisGejala.map((dg) => (
                      <span
                        key={dg.id}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm"
                      >
                        {dg.gejala.kode}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
