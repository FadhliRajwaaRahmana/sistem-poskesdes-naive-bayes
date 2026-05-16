import { getNaiveBayesPageData } from "@/lib/naive-bayes";
import { requireAdminSession } from "@/lib/session";
import {
  Calculator,
  ClipboardCheck,
  HeartPulse,
  Play,
  RotateCcw,
  Award,
  BarChart3,
  Table,
  CheckCircle2,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type PerhitunganPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function getSelectedIds(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)));
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

export default async function PerhitunganPage({ searchParams }: PerhitunganPageProps) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const selectedIds = getSelectedIds(params.gejalaId);
  const { overview, simulation } = await getNaiveBayesPageData(selectedIds);

  return (
    <section className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="animate-fade-in relative overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-10 shadow-xl sm:px-12 sm:py-14">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 opacity-5 rotate-12 pointer-events-none">
          <Calculator className="size-80 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
            <Calculator className="size-4" />
            <span>Simulator Mesin Inferensi</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Perhitungan Naive Bayes</h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-slate-300">
            Pelajari cara sistem mengambil keputusan. Jalankan simulasi perhitungan probabilitas secara transparan
            menggunakan nilai likelihood tetap yang ditetapkan oleh pakar.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="stagger-1 group animate-slide-up card-container transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="bg-emerald-100 text-emerald-600 border-emerald-200 border p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-sm">
              <ClipboardCheck className="size-6" />
            </div>
            <p className="text-4xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">{overview.totalGejala}</p>
          </div>
          <div className="mt-6">
            <p className="font-bold text-slate-700">Total Gejala</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Master gejala terdaftar</p>
          </div>
        </div>
        <div className="stagger-2 group animate-slide-up card-container transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="bg-rose-100 text-rose-600 border-rose-200 border p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-sm">
              <HeartPulse className="size-6" />
            </div>
            <p className="text-4xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">{overview.totalPenyakit}</p>
          </div>
          <div className="mt-6">
            <p className="font-bold text-slate-700">Total Penyakit</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Target klasifikasi</p>
          </div>
        </div>
      </div>

      {/* Simulation Form */}
      <div className="animate-slide-up stagger-3 card-container border-2 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20">
        <div className="mb-6 flex items-center gap-4 border-b border-indigo-100 pb-5">
          <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md shadow-indigo-600/20">
            <Play className="size-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Simulasi Perhitungan</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Pilih gejala untuk melihat hasil prior, likelihood (pakar), dan posterior akhir.
            </p>
          </div>
        </div>

        <form className="space-y-6" method="get">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 max-h-[400px] overflow-y-auto pr-2 clean-scroll p-1">
            {overview.gejalaList.map((gejala) => (
              <label
                key={gejala.id}
                className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-400 hover:shadow-md has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50 has-[:checked]:shadow-md"
              >
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="gejalaId"
                    value={gejala.id}
                    defaultChecked={selectedIds.includes(gejala.id)}
                    className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                  />
                  <CheckCircle2 className="pointer-events-none absolute size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
                </div>
                <span className="flex-1 grid gap-1 leading-none">
                  <span className="text-sm font-black text-slate-700 group-has-[:checked]:text-indigo-700 transition-colors">{gejala.kode}</span>
                  <span className="text-xs font-semibold text-slate-500 group-has-[:checked]:text-slate-700 leading-relaxed">{gejala.nama}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-indigo-100">
            <button
              type="submit"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-indigo-600 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95 gap-2"
            >
              <Play className="size-4" fill="currentColor" />
              Jalankan Simulasi
            </button>
            <a
              href="/dashboard/perhitungan"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md hover:text-indigo-600 active:scale-95 gap-2"
            >
              <RotateCcw className="size-4" />
              Reset Form
            </a>
          </div>
        </form>
      </div>

      {/* Simulation Results */}
      {simulation ? (
        <div className="animate-fade-in space-y-8">
          {/* Selected Symptoms */}
          <div className="card-container">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-emerald-100 text-emerald-600 border border-emerald-200 p-3 rounded-xl shadow-sm">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hasil Analisis Simulasi</h3>
                <p className="text-sm font-bold text-emerald-600 mt-1 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100 w-fit">
                  {simulation.status === "known" ? simulation.resultText : "Tidak dapat menentukan diagnosis"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {simulation.breakdown.length > 0 && simulation.breakdown[0].steps.map((step) => (
                <span
                  key={step.kodeGejala}
                  className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm"
                >
                  <span className="text-indigo-600 mr-2 font-black">{step.kodeGejala}</span> {step.namaGejala}
                </span>
              ))}
            </div>
          </div>

          {/* Ranking */}
          <div className="card-container bg-gradient-to-br from-white to-amber-50/30 border-amber-100">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-amber-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 text-amber-600 border border-amber-200 p-3 rounded-xl shadow-sm">
                  <Award className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Ranking Probabilitas</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Urutan penyakit berdasarkan posterior tertinggi</p>
                </div>
              </div>
              <span className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-lg">
                Total Score: {simulation.totalScore}
              </span>
            </div>

            <div className="space-y-4">
              {simulation.ranked.map((item, index) => {
                const isTop = index === 0;
                return (
                  <div
                    key={item.penyakitId}
                    className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${
                      isTop
                        ? "border-amber-300 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-sm border ${
                            isTop
                              ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/30"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className={`text-lg font-black ${isTop ? "text-amber-900" : "text-slate-900"}`}>
                            <span className="text-slate-400 mr-1.5 font-bold">{item.kodePenyakit}</span> {item.namaPenyakit}
                          </h4>
                          {isTop && (
                            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100/50 w-fit px-2 py-0.5 rounded border border-amber-200">Rekomendasi Utama</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm border-t border-slate-100 md:border-none pt-4 md:pt-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prior</span>
                          <span className="font-bold text-slate-900">{item.prior}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                          <span className="font-bold text-slate-900">{item.score}</span>
                        </div>
                        <div className={`flex flex-col gap-1 rounded-xl px-4 py-2 border shadow-sm ${
                            isTop
                                ? "bg-amber-100 border-amber-200"
                                : "bg-slate-50 border-slate-200"
                        }`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isTop ? "text-amber-700" : "text-slate-500"}`}>Posterior</span>
                          <span className={`font-black text-lg ${isTop ? "text-amber-700" : "text-slate-700"}`}>{item.posterior.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown per disease */}
          <div className="card-container space-y-6 bg-slate-50/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-sky-100 text-sky-600 border border-sky-200 p-3 rounded-xl shadow-sm">
                <Table className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Detail Kalkulasi per Penyakit</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  Prior × Π Likelihood = Score, lalu normalisasi ke Posterior.
                </p>
              </div>
            </div>

            <div className="space-y-6">
            {simulation.breakdown.map((item) => (
              <article key={item.penyakitId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="border-b border-slate-100 bg-white px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        <span className="text-slate-400 mr-1.5">{item.kodePenyakit}</span> {item.namaPenyakit}
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 font-semibold">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          Prior = 1/{overview.totalPenyakit} ={" "}
                          <span className="font-black text-slate-900">{item.prior}</span>
                        </span>
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          Likelihood Product:{" "}
                          <span className="font-black text-slate-900">{item.likelihoodProduct}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 shadow-sm flex flex-col items-center min-w-[100px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Score</p>
                        <p className="text-sm font-black text-slate-900">{item.score}</p>
                      </div>
                      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 shadow-sm flex flex-col items-center min-w-[100px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Posterior</p>
                        <p className="text-base font-black text-indigo-700">{item.posterior.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full caption-bottom text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider">
                      <tr className="border-b border-slate-200">
                        <th className="h-14 px-6 text-left align-middle">Gejala</th>
                        <th className="h-14 px-6 text-right align-middle">Likelihood (Pakar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.steps.map((step) => (
                        <tr
                          key={step.kodeGejala}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 px-6 align-middle font-semibold text-slate-700">
                            <span className="font-black text-indigo-600 mr-2">{step.kodeGejala}</span>
                            {step.namaGejala}
                          </td>
                          <td className="p-4 px-6 align-middle font-black text-slate-900 text-base text-right">{step.likelihood}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td className="p-4 px-6 font-black text-slate-700 text-sm">
                          Score = {item.prior} × {item.steps.map((s) => s.likelihood).join(" × ")}
                        </td>
                        <td className="p-4 px-6 font-black text-indigo-700 text-base text-right">{item.score}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Prior Table */}
      <div className="animate-fade-in card-container">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 text-rose-600 border border-rose-200 p-3 rounded-xl shadow-sm">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Probabilitas Prior P(Ci)</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">Probabilitas dasar setiap penyakit (uniform)</p>
            </div>
          </div>
          <span className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm uppercase tracking-widest">
            P(Ci) = 1 / {overview.totalPenyakit}
          </span>
        </div>
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full caption-bottom text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider">
              <tr className="border-b border-slate-200">
                <th className="h-14 px-6 text-left align-middle">Penyakit</th>
                <th className="h-14 px-6 text-left align-middle">Rumus</th>
                <th className="h-14 px-6 text-right align-middle">Nilai Prior</th>
              </tr>
            </thead>
            <tbody>
              {overview.priorTable.map((item) => (
                <tr
                  key={item.kodePenyakit}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors bg-white"
                >
                  <td className="p-5 px-6 align-middle font-bold text-slate-700">
                    <span className="text-rose-600 mr-2">{item.kodePenyakit}</span>
                    {item.namaPenyakit}
                  </td>
                  <td className="p-5 px-6 align-middle font-mono text-xs font-bold text-slate-500">
                    1 / {overview.totalPenyakit}
                  </td>
                  <td className="p-5 px-6 align-middle font-black text-slate-900 text-base text-right">{item.prior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Likelihood Matrix */}
      <div className="animate-fade-in card-container">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
          <div className="bg-purple-100 text-purple-600 border border-purple-200 p-3 rounded-xl shadow-sm">
            <Table className="size-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Tabel Likelihood P(Xi|Ci)</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Nilai likelihood tetap yang ditetapkan oleh pakar (0.0 – 1.0)
            </p>
          </div>
        </div>
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full caption-bottom text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider">
              <tr className="border-b border-slate-200">
                <th className="h-16 px-6 text-left align-middle border-r border-slate-200 bg-slate-100 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Gejala</th>
                {overview.likelihoodMatrix.map((row) => (
                  <th key={row.kodePenyakit} className="h-16 px-6 text-center align-middle">
                    <span className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-black text-rose-600 shadow-sm">
                      {row.kodePenyakit}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.gejalaList.map((gejala) => (
                <tr
                  key={gejala.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors bg-white group"
                >
                  <td className="p-4 px-6 align-middle font-bold text-slate-700 border-r border-slate-200 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-indigo-50/50 transition-colors">
                    <span className="text-indigo-600 mr-2">{gejala.kode}</span>
                    <span className="text-xs">{gejala.nama}</span>
                  </td>
                  {overview.likelihoodMatrix.map((row) => {
                    const cell = row.cells.find((c) => c.kodeGejala === gejala.kode);
                    const value = cell?.value ?? 0;
                    return (
                      <td key={row.kodePenyakit} className="p-4 px-6 align-middle text-center">
                        <span className={`font-black ${value > 0.5 ? "text-rose-600" : value > 0 ? "text-slate-900" : "text-slate-300"}`}>
                          {value > 0 ? value.toFixed(2) : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
