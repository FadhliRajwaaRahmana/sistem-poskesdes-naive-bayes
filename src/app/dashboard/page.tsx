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
  Zap,
  ActivitySquare,
} from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

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

      {/* System Info */}
      <div className="animate-slide-up stagger-5 card-container">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shadow-sm">
            <Zap className="size-5" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Info Sistem</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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

      {/* Recent Diagnoses List */}
      <div className="animate-slide-up stagger-6 card-container !p-0 overflow-hidden">
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
