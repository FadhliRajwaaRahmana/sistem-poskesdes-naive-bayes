import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Thermometer,
  Bug,
  Database,
  ClipboardList,
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
  const [
    totalGejala,
    totalPenyakit,
    totalTraining,
    totalDiagnosa,
    latestDiagnosa,
    diagnosaByResult,
    recentDiagnosa,
  ] = await Promise.all([
    prisma.gejala.count(),
    prisma.penyakit.count(),
    prisma.dataTraining.count(),
    prisma.diagnosaPasien.count(),
    prisma.diagnosaPasien.findFirst({
      orderBy: { createdAt: "desc" },
      include: { penyakit: true },
    }),
    prisma.diagnosaPasien.groupBy({
      by: ["hasilDiagnosa"],
      _count: { hasilDiagnosa: true },
      orderBy: { _count: { hasilDiagnosa: "desc" } },
      take: 5,
    }),
    prisma.diagnosaPasien.findMany({
      take: 5,
      orderBy: { tanggal: "desc" },
      include: {
        penyakit: true,
        user: true,
        diagnosaGejala: {
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

  const recentWeekDiagnosa = await prisma.diagnosaPasien.findMany({
    where: {
      tanggal: { gte: new Date(`${sevenDayBuckets[0]?.key}T00:00:00.000Z`) },
    },
    select: { tanggal: true },
  });

  for (const item of recentWeekDiagnosa) {
    const key = item.tanggal.toISOString().slice(0, 10);
    const bucket = sevenDayMap.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  }

  const maxWeeklyDiagnosa = Math.max(...sevenDayBuckets.map((item) => item.value), 1);
  const topResultCount = diagnosaByResult[0]?._count.hasilDiagnosa ?? 0;

  const stats = [
    { label: "Total Gejala", value: totalGejala, hint: "Master data gejala", icon: Thermometer, href: "/dashboard/gejala", color: "text-blue-600 bg-blue-100" },
    { label: "Total Penyakit", value: totalPenyakit, hint: "Klasifikasi penyakit", icon: Bug, href: "/dashboard/penyakit", color: "text-rose-600 bg-rose-100" },
    { label: "Data Training", value: totalTraining, hint: "Dataset sistem", icon: Database, href: "/dashboard/data-training", color: "text-amber-600 bg-amber-100" },
    { label: "Riwayat Diagnosa", value: totalDiagnosa, hint: "Total pasien", icon: ClipboardList, href: "/dashboard/riwayat", color: "text-emerald-600 bg-emerald-100" },
  ];

  return (
    <section className="space-y-6 pb-10">
      {/* High-Contrast Hero Banner */}
      <div className="animate-fade-in flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-8 rounded-2xl bg-slate-900 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-4">
            <ActivitySquare className="size-4" />
            <span>Dashboard Admin</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Ringkasan Sistem
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
            Pantau seluruh data statistik POSKESDES secara real-time. Kelola penyakit, gejala, dan evaluasi hasil klasifikasi.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link
            href="/dashboard/diagnosa"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
          >
            <Stethoscope className="mr-2 size-5" />
            Diagnosa Baru
          </Link>
          <Link
            href="/dashboard/perhitungan"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white border border-white/20 transition-all hover:bg-white/20 hover:-translate-y-0.5 active:scale-95"
          >
            <Calculator className="mr-2 size-5" />
            Perhitungan
          </Link>
        </div>
      </div>

      {/* Solid Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`stagger-${index + 1} card-container group animate-slide-up block transition-all hover:-translate-y-1 hover:border-primary/30`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex size-12 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="size-6" />
                </div>
              </div>
              <div className="mt-6">
                <p className="text-4xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                  {item.value}
                </p>
                <p className="mt-1 font-bold text-slate-700">{item.label}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{item.hint}</p>
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
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Aktivitas 7 Hari</h3>
              <p className="text-sm font-medium text-slate-500">Intensitas diagnosa pasien per hari</p>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-7 items-end gap-3 sm:gap-6 h-[240px]">
            {sevenDayBuckets.map((item) => (
              <div key={item.key} className="group flex flex-col items-center gap-3 h-full justify-end">
                <div className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">
                  {item.value}
                </div>
                <div className="w-full rounded-t-lg rounded-b-sm bg-slate-200 transition-all duration-300 group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(67,56,202,0.3)]"
                  style={{
                    height: `${Math.max((item.value / maxWeeklyDiagnosa) * 100, item.value > 0 ? 10 : 2)}%`,
                    backgroundColor: item.value > 0 ? 'var(--primary)' : undefined,
                    opacity: item.value > 0 ? 1 : 0.5
                  }}
                />
                <div className="text-center text-xs font-bold text-slate-500 mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          {/* Top Results */}
          <div className="animate-slide-up stagger-6 card-container">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Top Penyakit</h3>
                <p className="text-sm font-medium text-slate-500">Hasil diagnosis terbanyak</p>
              </div>
            </div>

            {diagnosaByResult.length === 0 ? (
              <div className="mt-8 flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
                Data belum tersedia.
              </div>
            ) : (
              <div className="space-y-6">
                {diagnosaByResult.map((item) => {
                  const count = item._count.hasilDiagnosa;
                  const width = topResultCount > 0 ? (count / topResultCount) * 100 : 0;

                  return (
                    <div key={item.hasilDiagnosa} className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-900">{item.hasilDiagnosa}</span>
                        <span className="font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">{count} kasus ({totalDiagnosa > 0 ? formatPercentage((count / totalDiagnosa) * 100) : "0%"})</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* System Spotlight */}
          <div className="animate-slide-up stagger-7 card-container">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Zap className="size-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Info Sistem</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border-2 border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Diagnosa Terakhir</p>
                <p className="font-bold text-slate-900 text-sm">
                  {latestDiagnosa
                    ? <>{latestDiagnosa.namaPasien} <span className="text-slate-400 mx-1">&rarr;</span> <span className="text-primary">{latestDiagnosa.hasilDiagnosa}</span></>
                    : "Belum ada diagnosa."}
                </p>
              </div>
              <div className="rounded-xl border-2 border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Status Dataset</p>
                <p className="font-bold text-slate-900 text-sm">
                  {totalTraining > 0
                    ? <><span className="text-success">{totalTraining} Baris</span> untuk {totalPenyakit} Penyakit</>
                    : "Data Kosong."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Diagnoses List */}
      <div className="animate-slide-up stagger-8 card-container !p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 p-6 sm:p-8 bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="flex size-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
              <ActivitySquare className="size-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Riwayat Terkini</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">5 aktivitas diagnosa pasien terakhir</p>
            </div>
          </div>
          <Link
            href="/dashboard/riwayat"
            className="mt-4 sm:mt-0 inline-flex items-center justify-center h-10 px-5 rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm border-2 border-slate-200 hover:border-slate-300 hover:text-primary hover:shadow-md transition-all active:scale-95"
          >
            Lihat Semua Riwayat
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>

        <div className="p-6 sm:p-8">
          {recentDiagnosa.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
              Belum ada riwayat aktivitas.
            </div>
          ) : (
            <div className="space-y-4">
              {recentDiagnosa.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col gap-4 rounded-xl border-2 border-slate-100 p-5 transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{item.namaPasien}</h4>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      {dateFormatter.format(item.tanggal)} <span className="mx-2 text-slate-300">•</span> Admin: {item.user.name}
                    </p>
                    <div className="mt-3">
                       <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                          Hasil: <span className="ml-1.5 text-primary">{item.hasilDiagnosa}</span>
                       </span>
                    </div>
                  </div>
                  <div className="flex max-w-sm flex-wrap gap-2">
                    {item.diagnosaGejala.map((gejala) => (
                      <span
                        key={gejala.id}
                        className="inline-flex items-center rounded-md border-2 border-slate-100 bg-white px-2.5 py-1 text-xs font-bold text-slate-600"
                      >
                        {gejala.gejala.kode}
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