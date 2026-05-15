import { DiagnosisForm } from "./diagnosis-form";
import { prisma } from "@/lib/prisma";
import { getDiagnosisComputation } from "@/lib/naive-bayes";
import { requireSession } from "@/lib/session";
import {
  Stethoscope,
  CheckCircle2,
  Printer,
  Award,
  ShieldAlert,
  HeartPulse,
  Calculator,
  CalendarDays,
  BookOpen,
  Lightbulb,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type DiagnosisPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function DiagnosisPage({ searchParams }: DiagnosisPageProps) {
  await requireSession();
  const params = searchParams ? await searchParams : {};
  const gejalaList = await prisma.gejala.findMany({ orderBy: { kode: "asc" } });
  const diagnosisId = getSearchValue(params.diagnosisId);

  const savedDiagnosis = diagnosisId
    ? await prisma.diagnosisBalita.findUnique({
        where: { id: diagnosisId },
        include: {
          penyakit: true,
          diagnosisGejala: {
            include: { gejala: true },
            orderBy: { gejala: { kode: "asc" } },
          },
          diagnosisRanking: {
            orderBy: { peringkat: "asc" },
          },
        },
      })
    : null;

  const computation = savedDiagnosis && savedDiagnosis.diagnosisGejala.length > 0
    ? await getDiagnosisComputation(savedDiagnosis.diagnosisGejala.map((dg) => dg.gejalaId))
    : null;

  const isGiziBaik = savedDiagnosis?.hasilDiagnosis === "Gizi Baik";

  return (
    <section className="animate-fade-in space-y-8 pb-12">
      {/* Page Header */}
      <div className="stagger-1 animate-slide-down">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-10 shadow-xl sm:px-12 sm:py-14">
          <div className="absolute right-0 top-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <Stethoscope className="size-80 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
              <Stethoscope className="size-4" />
              <span>Sistem Pakar Naive Bayes</span>
            </div>
            <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">Diagnosis Balita</h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-300">
              Isi data balita, masukkan pengukuran antropometri, dan pilih gejala klinis.
              Sistem akan menganalisis status gizi menggunakan algoritma Naive Bayes dan standar WHO.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
        {/* Form Card */}
        <div className="stagger-3 animate-slide-up card-container">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-primary shadow-sm">
              <HeartPulse className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Data Balita & Gejala</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">Lengkapi form di bawah ini.</p>
            </div>
          </div>

          <DiagnosisForm gejalaList={gejalaList.map((g) => ({ id: g.id, kode: g.kode, nama: g.nama }))} />
        </div>

        {/* Result Card */}
        <div className="stagger-4 animate-slide-up card-container h-fit sticky top-24">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="rounded-2xl bg-amber-100 border border-amber-200 p-3 text-amber-600 shadow-sm">
              <Award className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hasil Analisis</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">Laporan diagnosis terbaru.</p>
            </div>
          </div>

          {savedDiagnosis ? (
            <div className="mt-8 space-y-8">
              {/* Patient Info */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Balita</p>
                      <h4 className="text-2xl font-black text-slate-900">{savedDiagnosis.namaBalita}</h4>
                    </div>
                    <a
                      href={`/dashboard/rekam-medis?diagnosisId=${savedDiagnosis.id}&print=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-primary hover:text-primary hover:bg-slate-50 active:scale-95 shrink-0"
                    >
                      <Printer className="mr-2 size-4" />
                      Cetak Hasil
                    </a>
                  </div>

                  {/* Detail Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tanggal</p>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {savedDiagnosis.tanggal.toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">NIK</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.nik}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Jenis Kelamin</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nama Ibu</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.namaIbu}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dusun</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.dusun}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Umur</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.umurBulan} bulan</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Berat Badan</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.beratBadan} kg</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tinggi Badan</p>
                      <p className="font-bold text-slate-800">{savedDiagnosis.tinggiBadan} cm</p>
                    </div>
                    {savedDiagnosis.lila !== null && (
                      <div className="rounded-lg bg-white border border-slate-100 p-3 col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">LiLA</p>
                        <p className="font-bold text-slate-800">{savedDiagnosis.lila} cm</p>
                      </div>
                    )}
                  </div>

                  {/* Diagnosis Result */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm mb-3">
                      {isGiziBaik ? (
                        <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="size-5" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="rounded-full bg-rose-100 p-1 text-rose-600 border border-rose-200 shadow-sm">
                          <ShieldAlert className="size-5" strokeWidth={3} />
                        </div>
                      )}
                      <span className="font-bold text-slate-600 text-base">
                        Hasil:{" "}
                        <span className={`text-xl ml-1 font-black px-3 py-1 rounded-lg border ${
                          isGiziBaik
                            ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                            : "text-rose-600 bg-rose-50 border-rose-100"
                        }`}>
                          {!isGiziBaik && savedDiagnosis.penyakit ? `[${savedDiagnosis.penyakit.kode}] ` : ""}
                          {savedDiagnosis.hasilDiagnosis}
                          {!isGiziBaik && savedDiagnosis.diagnosisRanking[0]
                            ? ` (${savedDiagnosis.diagnosisRanking[0].posterior.toFixed(2)}%)`
                            : ""}
                        </span>
                      </span>
                    </div>
                    {savedDiagnosis.keterangan && (
                      <p className="text-sm font-semibold text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        {savedDiagnosis.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Deskripsi Penyakit */}
              {!isGiziBaik && savedDiagnosis.penyakit?.deskripsi && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-sky-600" />
                    <p className="text-sm font-bold text-slate-800">Deskripsi Penyakit</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed bg-sky-50 p-4 rounded-xl border border-sky-100">
                    {savedDiagnosis.penyakit.deskripsi}
                  </p>
                </div>
              )}

              {/* Saran Penanganan */}
              {!isGiziBaik && savedDiagnosis.penyakit?.saranPenanganan && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-600" />
                    <p className="text-sm font-bold text-slate-800">Saran Penanganan</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-100">
                    {savedDiagnosis.penyakit.saranPenanganan}
                  </p>
                </div>
              )}

              {/* Selected Symptoms */}
              {savedDiagnosis.diagnosisGejala.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">Gejala Terpilih</p>
                    <span className="rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-bold border border-slate-200">
                      {savedDiagnosis.diagnosisGejala.length} Gejala
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedDiagnosis.diagnosisGejala.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                      >
                        <span className="text-primary mr-2 font-black">{item.gejala.kode}</span>
                        {item.gejala.nama}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Probability Ranking */}
              {savedDiagnosis.diagnosisRanking.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Ranking Probabilitas</p>
                  <div className="space-y-3">
                    {savedDiagnosis.diagnosisRanking.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex size-10 items-center justify-center rounded-xl text-sm font-black shadow-sm border ${
                              index === 0
                                ? "bg-primary border-primary text-white"
                                : index === 1
                                ? "bg-slate-100 border-slate-200 text-slate-700"
                                : index === 2
                                ? "bg-slate-50 border-slate-200 text-slate-500"
                                : "bg-white border-slate-100 text-slate-400"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-black ${index === 0 ? "text-primary" : "text-slate-800"}`}>
                              {item.namaPenyakit}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                              KODE: {item.kodePenyakit}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-3 py-1.5 text-sm font-black shadow-sm border ${
                            index === 0
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.posterior.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step NB Calculation */}
              {computation && computation.breakdown.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calculator className="size-4 text-violet-600" />
                    <p className="text-sm font-bold text-slate-800">Detail Perhitungan Naive Bayes</p>
                  </div>

                  <div className="space-y-4">
                    {computation.breakdown.map((bd) => (
                      <div
                        key={bd.penyakitId}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              {bd.kodePenyakit}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{bd.namaPenyakit}</span>
                          </div>
                          <span className="text-sm font-black text-primary">
                            {bd.posterior.toFixed(2)}%
                          </span>
                        </div>

                        <div className="p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                            <span className="font-bold text-sky-700">Prior P({bd.kodePenyakit})</span>
                            <span className="font-black text-sky-800">{bd.prior}</span>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Likelihood per Gejala</p>
                            {bd.steps.map((step) => (
                              <div
                                key={step.kodeGejala}
                                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                              >
                                <span className="font-medium text-slate-600">
                                  P(<span className="font-bold text-primary">{step.kodeGejala}</span> | {bd.kodePenyakit})
                                </span>
                                <span className="font-black text-slate-800">{step.likelihood}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <span className="font-bold text-slate-600">Likelihood Product</span>
                            <span className="font-black text-slate-800">{bd.likelihoodProduct}</span>
                          </div>

                          <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                            <span className="font-bold text-violet-700">Score = Prior × Likelihood</span>
                            <span className="font-black text-violet-800">{bd.score}</span>
                          </div>

                          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                            <span className="font-bold text-primary">Posterior = Score / Total × 100%</span>
                            <span className="font-black text-primary">{bd.posterior.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-3">
                      <span className="text-xs font-bold">Total Score (Σ semua penyakit)</span>
                      <span className="text-sm font-black">{computation.totalScore}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
                <Stethoscope className="size-10 text-slate-300 stroke-[2]" />
              </div>
              <p className="text-xl font-black text-slate-800">Belum Ada Hasil</p>
              <p className="mt-3 text-sm font-bold text-slate-500 max-w-[250px] leading-relaxed">
                Silakan isi data balita dan pilih gejala klinis untuk memproses diagnosis.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
