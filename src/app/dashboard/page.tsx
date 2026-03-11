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

const statIcons = [Thermometer, Bug, Database, ClipboardList];

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
      orderBy: {
        createdAt: "desc",
      },
      include: {
        penyakit: true,
      },
    }),
    prisma.diagnosaPasien.groupBy({
      by: ["hasilDiagnosa"],
      _count: {
        hasilDiagnosa: true,
      },
      orderBy: {
        _count: {
          hasilDiagnosa: "desc",
        },
      },
      take: 5,
    }),
    prisma.diagnosaPasien.findMany({
      take: 5,
      orderBy: {
        tanggal: "desc",
      },
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
      tanggal: {
        gte: new Date(`${sevenDayBuckets[0]?.key}T00:00:00.000Z`),
      },
    },
    select: {
      tanggal: true,
    },
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
    {
      label: "Total Gejala",
      value: totalGejala,
      hint: "Master gejala aktif",
      href: "/dashboard/gejala",
    },
    {
      label: "Total Penyakit",
      value: totalPenyakit,
      hint: "Target klasifikasi",
      href: "/dashboard/penyakit",
    },
    {
      label: "Data Training",
      value: totalTraining,
      hint: "Dataset Naive Bayes",
      href: "/dashboard/data-training",
    },
    {
      label: "Riwayat Diagnosa",
      value: totalDiagnosa,
      hint: "Diagnosa pasien",
      href: "/dashboard/riwayat",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Ringkasan Sistem
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau statistik master data dan aktivitas diagnosa terbaru.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/diagnosa"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Stethoscope className="mr-2 size-4" />
            Input Diagnosa
          </Link>
          <Link
            href="/dashboard/perhitungan"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Calculator className="mr-2 size-4" />
            Perhitungan
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = statIcons[index];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`stagger-${index + 1} group animate-slide-up rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-card-hover`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Activity Chart */}
        <div className="animate-slide-up stagger-5 col-span-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold leading-none tracking-tight">Aktivitas 7 Hari</h3>
              <p className="text-sm text-muted-foreground mt-1.5">Diagnosa pasien per hari</p>
            </div>
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-8 grid grid-cols-7 items-end gap-2 sm:gap-4 h-[200px]">
            {sevenDayBuckets.map((item) => (
              <div key={item.key} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-xs font-medium text-muted-foreground">
                  {item.value}
                </div>
                <div className="w-full rounded-sm bg-primary transition-all duration-300"
                  style={{
                    height: `${Math.max((item.value / maxWeeklyDiagnosa) * 100, item.value > 0 ? 10 : 2)}%`,
                    opacity: item.value > 0 ? 1 : 0.2
                  }}
                />
                <div className="text-center text-xs text-muted-foreground mt-2">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          {/* Top Results */}
          <div className="animate-slide-up stagger-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold leading-none tracking-tight">Diagnosa Terbanyak</h3>
                <p className="text-sm text-muted-foreground mt-1.5">Top 5 hasil klasifikasi</p>
              </div>
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>

            {diagnosaByResult.length === 0 ? (
              <div className="mt-6 flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                Belum ada data diagnosa.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {diagnosaByResult.map((item) => {
                  const count = item._count.hasilDiagnosa;
                  const width = topResultCount > 0 ? (count / topResultCount) * 100 : 0;

                  return (
                    <div key={item.hasilDiagnosa} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.hasilDiagnosa}</span>
                        <span className="text-muted-foreground">{count} kasus ({totalDiagnosa > 0 ? formatPercentage((count / totalDiagnosa) * 100) : "0%"})</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-500"
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
          <div className="animate-slide-up stagger-7 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold leading-none tracking-tight">Status Sistem</h3>
              <Zap className="size-4 text-muted-foreground" />
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid gap-1">
                <p className="font-medium">Diagnosa Terakhir</p>
                <p className="text-muted-foreground">
                  {latestDiagnosa
                    ? `${latestDiagnosa.namaPasien} - ${latestDiagnosa.hasilDiagnosa} (${dateFormatter.format(latestDiagnosa.createdAt)})`
                    : "Belum ada diagnosa yang diproses."}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="font-medium">Kesiapan Dataset</p>
                <p className="text-muted-foreground">
                  {totalTraining > 0
                    ? `${totalTraining} sampel tersedia untuk ${totalPenyakit} penyakit.`
                    : "Data training belum tersedia."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Diagnoses */}
      <div className="animate-slide-up stagger-8 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Aktivitas Terbaru</h3>
            <p className="text-sm text-muted-foreground mt-1.5">5 diagnosa pasien terakhir</p>
          </div>
          <Link
            href="/dashboard/riwayat"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="p-6">
          {recentDiagnosa.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Belum ada aktivitas diagnosa.
            </div>
          ) : (
            <div className="space-y-4">
              {recentDiagnosa.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium leading-none">{item.namaPasien}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dateFormatter.format(item.tanggal)} • Oleh {item.user.name}
                    </p>
                    <p className="text-sm font-medium pt-1">
                      Hasil: <span className="text-primary">{item.hasilDiagnosa}</span>
                    </p>
                  </div>
                  <div className="flex max-w-sm flex-wrap gap-1.5">
                    {item.diagnosaGejala.map((gejala) => (
                      <span
                        key={gejala.id}
                        className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors"
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