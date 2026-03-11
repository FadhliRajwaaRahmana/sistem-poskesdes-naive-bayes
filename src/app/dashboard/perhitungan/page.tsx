import { getNaiveBayesPageData } from "@/lib/naive-bayes";
import {
  Calculator,
  Database,
  Thermometer,
  Bug,
  Play,
  RotateCcw,
  Award,
  BarChart3,
  Table,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type PerhitunganPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getSelectedIds(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)));
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

const statCards = [
  {
    label: "Total Data Training",
    hint: "Dataset Naive Bayes aktif",
    icon: Database,
    colorClasses: "bg-blue-100 text-blue-600 group-hover:bg-blue-200",
  },
  {
    label: "Total Gejala",
    hint: "Master gejala terdaftar",
    icon: Thermometer,
    colorClasses: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200",
  },
  {
    label: "Total Penyakit",
    hint: "Target klasifikasi",
    icon: Bug,
    colorClasses: "bg-rose-100 text-rose-600 group-hover:bg-rose-200",
  },
];

export default async function PerhitunganPage({ searchParams }: PerhitunganPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedIds = getSelectedIds(params.gejalaId);
  const { overview, simulation } = await getNaiveBayesPageData(selectedIds);

  const statValues = [overview.totalTraining, overview.totalGejala, overview.penyakitMaster.length];

  return (
    <section className="space-y-8 pb-12">
      {/* ───── Page Header ───── */}
      <div className="animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Perhitungan Naive Bayes</h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">
              Lihat data training aktif, probabilitas prior, likelihood setiap gejala terhadap penyakit, lalu
              jalankan simulasi perhitungan tanpa menyimpan ke riwayat diagnosa.
            </p>
          </div>
        </div>
      </div>

      {/* ───── Summary Stat Cards ───── */}
      <div className="grid gap-6 sm:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`stagger-${index + 1} group animate-slide-up bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <div className={`${card.colorClasses} p-3 rounded-2xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="size-6" />
                </div>
              </div>
              <p className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900">{statValues[index]}</p>
              <p className="mt-2 text-sm text-slate-500 font-medium">{card.hint}</p>
            </div>
          );
        })}
      </div>

      {/* ───── Simulation Form ───── */}
      <div className="animate-slide-up stagger-4 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl">
            <Play className="size-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Simulasi Perhitungan</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Pilih gejala, lalu sistem menghitung prior, likelihood dengan Laplace smoothing, dan posterior.
            </p>
          </div>
        </div>

        <form className="space-y-6" method="get">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overview.gejalaMaster.map((gejala) => (
              <label
                key={gejala.id}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white/50 px-5 py-4 text-sm text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/50 has-[:checked]:shadow-md has-[:checked]:ring-1 has-[:checked]:ring-indigo-500"
              >
                <input
                  type="checkbox"
                  name="gejalaId"
                  value={gejala.id}
                  defaultChecked={selectedIds.includes(gejala.id)}
                  className="size-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                />
                <span className="select-none flex-1">
                  <span className="font-bold text-indigo-600">{gejala.kode}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-medium">{gejala.nama}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 rounded-xl transition-all active:scale-95 px-6 py-3 font-semibold text-sm gap-2"
            >
              <Play className="size-4" />
              Jalankan Simulasi
            </button>
            <a
              href="/dashboard/perhitungan"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md rounded-xl transition-all active:scale-95 px-6 py-3 font-semibold text-sm gap-2"
            >
              <RotateCcw className="size-4" />
              Reset
            </a>
          </div>
        </form>
      </div>

      {/* ───── Simulation Results ───── */}
      {simulation ? (
        <div className="animate-fade-in space-y-8">
          {/* Selected Symptoms + Note */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Hasil Simulasi</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{simulation.note}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {simulation.selectedGejala.map((item) => (
                <span
                  key={item.id}
                  className="rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
                >
                  <span className="opacity-75 mr-1">{item.kode}</span> {item.nama}
                </span>
              ))}
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl">
                  <Award className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Ranking Probabilitas</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Urutan berdasarkan posterior tertinggi</p>
                </div>
              </div>
              <span className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md">
                Total score: {simulation.totalScore}
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
                        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30"
                        : "border-slate-100 bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold shadow-sm ${
                            isTop
                              ? "bg-amber-500 text-white shadow-amber-500/30"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            <span className="text-slate-500 mr-1">{item.kode}</span> {item.nama}
                          </h4>
                          {isTop && (
                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-600">Probabilitas tertinggi</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <span className="font-medium text-slate-500">
                          Prior: <span className="font-bold text-slate-900">{item.prior}</span>
                        </span>
                        <span className="font-medium text-slate-500">
                          Score: <span className="font-bold text-slate-900">{item.score}</span>
                        </span>
                        <span className={`rounded-xl px-4 py-1.5 text-sm font-extrabold shadow-sm ${
                            isTop
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {(item.posterior * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown per disease */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-sky-100 text-sky-600 p-3 rounded-2xl">
                <Table className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Langkah Perhitungan per Penyakit</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Detail prior, likelihood, dan score akhir</p>
              </div>
            </div>

            <div className="space-y-6">
            {simulation.breakdown.map((item) => (
              <article key={item.penyakitId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        <span className="text-slate-500 mr-1">{item.kode}</span> {item.nama}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          Prior <span className="text-slate-400">=</span> {item.priorNumerator}/{item.priorDenominator} <span className="text-slate-400">=</span>{" "}
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{item.prior}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          Total kemunculan gejala kelas:{" "}
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{item.totalGejalaOccurrences}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white px-4 py-2.5 text-center border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Score</p>
                        <p className="text-sm font-extrabold text-slate-900">{item.score}</p>
                      </div>
                      <div className="rounded-xl bg-indigo-50 px-4 py-2.5 text-center border border-indigo-100 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">Posterior</p>
                        <p className="text-sm font-extrabold text-indigo-700">{(item.posterior * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 font-semibold">
                      <tr className="border-b border-slate-100">
                        <th className="h-12 px-6 text-left align-middle">Gejala</th>
                        <th className="h-12 px-6 text-left align-middle">Match</th>
                        <th className="h-12 px-6 text-left align-middle">Rumus</th>
                        <th className="h-12 px-6 text-left align-middle">
                          Likelihood
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.steps.map((step) => (
                        <tr
                          key={step.gejalaId}
                          className="border-b border-slate-50 transition-colors hover:bg-slate-50/80"
                        >
                          <td className="p-6 align-middle font-medium text-slate-700">
                            <span className="font-bold text-indigo-600">{step.kode}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            <span>{step.nama}</span>
                          </td>
                          <td className="p-6 align-middle">
                            <span
                              className={`inline-flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm ${
                                step.matchedCount > 0
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {step.matchedCount}
                            </span>
                          </td>
                          <td className="p-6 align-middle font-mono text-xs font-medium text-slate-500">
                            ({step.matchedCount} + 1) / ({item.totalGejalaOccurrences} + {overview.totalGejala}) ={" "}
                            <span className="text-slate-700 font-bold">{step.numerator}/{step.denominator}</span>
                          </td>
                          <td className="p-6 align-middle font-bold text-slate-900 text-base">{step.likelihood}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] px-6 py-16 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-6 shadow-inner">
            <Calculator className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Simulasi</h3>
          <p className="text-base font-medium text-slate-500 max-w-md mx-auto">
            Pilih gejala pada form di atas lalu jalankan simulasi untuk melihat detail perhitungan Naive Bayes.
          </p>
        </div>
      )}

      {/* ───── Prior Table ───── */}
      <div className="animate-fade-in bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 text-rose-600 p-3 rounded-2xl">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Probabilitas Prior P(Ck)</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Probabilitas awal setiap penyakit</p>
            </div>
          </div>
          <span className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
            Berdasarkan {overview.totalTraining} data training
          </span>
        </div>
        <div className="w-full overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold">
              <tr className="border-b border-slate-100">
                <th className="h-12 px-6 text-left align-middle">Penyakit</th>
                <th className="h-12 px-6 text-left align-middle">
                  Jumlah Training
                </th>
                <th className="h-12 px-6 text-left align-middle">Rumus</th>
                <th className="h-12 px-6 text-left align-middle">Prior</th>
              </tr>
            </thead>
            <tbody>
              {overview.priorRows.map((item) => (
                <tr
                  key={item.penyakitId}
                  className="border-b border-slate-100 hover:bg-white/50 transition-colors"
                >
                  <td className="p-6 align-middle font-medium text-slate-700">
                    <span className="font-bold text-indigo-600">{item.kode}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    {item.nama}
                  </td>
                  <td className="p-6 align-middle">
                    <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700 shadow-sm">
                      {item.trainingCount}
                    </span>
                  </td>
                  <td className="p-6 align-middle font-mono text-sm font-medium text-slate-500">
                    {item.trainingCount} / {item.totalTraining || 0}
                  </td>
                  <td className="p-6 align-middle font-bold text-slate-900 text-base">{item.prior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───── Likelihood Table ───── */}
      <div className="animate-fade-in bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl">
            <Table className="size-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Likelihood P(Xi|Ck)</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Nilai likelihood dihitung dengan Laplace smoothing:{" "}
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                (jumlah match + 1) / (total kemunculan gejala pada kelas + total gejala)
              </span>
            </p>
          </div>
        </div>
        <div className="w-full overflow-auto rounded-xl border border-slate-100">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold">
              <tr className="border-b border-slate-100">
                <th className="h-12 px-6 text-left align-middle border-r border-slate-100">Gejala</th>
                {overview.penyakitMaster.map((penyakit) => (
                  <th key={penyakit.id} className="h-12 px-4 text-center align-middle">
                    <span className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                      {penyakit.kode}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.likelihoodRows.map((row) => (
                <tr
                  key={row.gejalaId}
                  className="border-b border-slate-100 hover:bg-white/50 transition-colors"
                >
                  <td className="p-6 align-middle font-medium text-slate-700 border-r border-slate-50 bg-white/30">
                    <span className="font-bold text-indigo-600">{row.kode}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    {row.nama}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.penyakitId} className="p-4 align-middle text-center">
                      {cell.likelihood === null ? (
                        <span className="text-slate-300 font-medium">—</span>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-base">{cell.likelihood}</p>
                          <p className="font-mono text-[11px] font-medium text-slate-400">
                            ({cell.matchedCount}+1)/({cell.trainingCount}+{overview.totalGejala})
                          </p>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───── Training Samples ───── */}
      <div className="animate-fade-in bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 lg:p-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 text-teal-600 p-3 rounded-2xl">
              <Database className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Data Training Aktif</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Dataset yang digunakan oleh klasifikasi</p>
            </div>
          </div>
          <span className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
            Total {overview.trainingSamples.length} sampel
          </span>
        </div>

        {overview.trainingSamples.length === 0 ? (
          <div className="px-6 py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 mb-6">
              <Database className="size-8" />
            </div>
            <p className="text-base font-medium text-slate-500">Belum ada data training.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {overview.trainingSamples.map((item, index) => (
              <div
                key={item.id}
                className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/50 p-5 transition-all hover:bg-white hover:shadow-md lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-sm font-extrabold text-slate-600 shadow-sm">
                      {overview.trainingSamples.length - index}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        <span className="text-slate-500 mr-1">{item.penyakitKode}</span> {item.penyakitNama}
                      </h4>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">Dibuat {dateFormatter.format(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:pl-14">
                    {item.gejala.map((gejala) => (
                      <span
                        key={gejala.id}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        <span className="opacity-75 mr-1">{gejala.kode}</span> {gejala.nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
