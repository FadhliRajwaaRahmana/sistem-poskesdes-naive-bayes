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
  },
  {
    label: "Total Gejala",
    hint: "Master gejala terdaftar",
    icon: Thermometer,
  },
  {
    label: "Total Penyakit",
    hint: "Target klasifikasi",
    icon: Bug,
  },
];

export default async function PerhitunganPage({ searchParams }: PerhitunganPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedIds = getSelectedIds(params.gejalaId);
  const { overview, simulation } = await getNaiveBayesPageData(selectedIds);

  const statValues = [overview.totalTraining, overview.totalGejala, overview.penyakitMaster.length];

  return (
    <section className="space-y-8">
      {/* ───── Page Header ───── */}
      <div className="animate-fade-in border-b pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Perhitungan Naive Bayes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Lihat data training aktif, probabilitas prior, likelihood setiap gejala terhadap penyakit, lalu
              jalankan simulasi perhitungan tanpa menyimpan ke riwayat diagnosa.
            </p>
          </div>
        </div>
      </div>

      {/* ───── Summary Stat Cards ───── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`stagger-${index + 1} group animate-slide-up rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{statValues[index]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </div>
          );
        })}
      </div>

      {/* ───── Simulation Form ───── */}
      <div className="animate-slide-up stagger-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <Play className="size-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Simulasi Perhitungan</h3>
              <p className="text-sm text-muted-foreground">
                Pilih gejala, lalu sistem menghitung prior, likelihood dengan Laplace smoothing, dan posterior.
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-5 p-6" method="get">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.gejalaMaster.map((gejala) => (
              <label
                key={gejala.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary"
              >
                <input
                  type="checkbox"
                  name="gejalaId"
                  value={gejala.id}
                  defaultChecked={selectedIds.includes(gejala.id)}
                  className="size-4 rounded border-primary text-primary focus:ring-primary"
                />
                <span className="select-none">
                  <span className="font-semibold text-primary">{gejala.kode}</span>
                  <span className="mx-1.5 text-muted-foreground">—</span>
                  {gejala.nama}
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Play className="size-4" />
              Jalankan Simulasi
            </button>
            <a
              href="/dashboard/perhitungan"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <RotateCcw className="size-4" />
              Reset
            </a>
          </div>
        </form>
      </div>

      {/* ───── Simulation Results ───── */}
      {simulation ? (
        <div className="animate-fade-in space-y-6">
          {/* Selected Symptoms + Note */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-primary" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Hasil Simulasi</h3>
                <p className="text-sm text-muted-foreground">{simulation.note}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {simulation.selectedGejala.map((item) => (
                <span
                  key={item.id}
                  className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                >
                  {item.kode} — {item.nama}
                </span>
              ))}
            </div>
          </div>

          {/* Ranking */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Award className="size-5 text-primary" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">Ranking Probabilitas</h3>
                  <p className="text-xs text-muted-foreground">Urutan berdasarkan posterior tertinggi</p>
                </div>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Total score: {simulation.totalScore}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {simulation.ranked.map((item, index) => {
                const isTop = index === 0;
                return (
                  <div
                    key={item.penyakitId}
                    className={`relative overflow-hidden rounded-md border p-4 transition-colors ${
                      isTop
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                            isTop
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {item.kode} — {item.nama}
                          </h4>
                          {isTop && (
                            <p className="mt-0.5 text-xs font-medium text-primary">Probabilitas tertinggi</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Prior: <span className="font-semibold text-foreground">{item.prior}</span>
                        </span>
                        <span>
                          Score: <span className="font-semibold text-foreground">{item.score}</span>
                        </span>
                        <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Table className="size-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Langkah Perhitungan per Penyakit</h3>
                <p className="text-xs text-muted-foreground">Detail prior, likelihood, dan score akhir</p>
              </div>
            </div>

            {simulation.breakdown.map((item) => (
              <article key={item.penyakitId} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/30 px-6 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.kode} — {item.nama}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Prior = {item.priorNumerator}/{item.priorDenominator} ={" "}
                          <span className="font-semibold text-foreground">{item.prior}</span>
                        </span>
                        <span>
                          Total kemunculan gejala kelas:{" "}
                          <span className="font-semibold text-foreground">{item.totalGejalaOccurrences}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-background px-3 py-2 text-center border shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
                        <p className="text-sm font-bold text-foreground">{item.score}</p>
                      </div>
                      <div className="rounded-md bg-primary/10 px-3 py-2 text-center border border-primary/20">
                        <p className="text-[10px] uppercase tracking-wider text-primary">Posterior</p>
                        <p className="text-sm font-bold text-primary">{(item.posterior * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Gejala</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Match</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Rumus</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                          Likelihood
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.steps.map((step) => (
                        <tr
                          key={step.gejalaId}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle font-medium text-foreground">
                            <span className="text-primary">{step.kode}</span>
                            <span className="mx-1 text-muted-foreground">—</span>
                            <span>{step.nama}</span>
                          </td>
                          <td className="p-4 align-middle">
                            <span
                              className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-bold ${
                                step.matchedCount > 0
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {step.matchedCount}
                            </span>
                          </td>
                          <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                            ({step.matchedCount} + 1) / ({item.totalGejalaOccurrences} + {overview.totalGejala}) ={" "}
                            {step.numerator}/{step.denominator}
                          </td>
                          <td className="p-4 align-middle font-semibold text-foreground">{step.likelihood}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in rounded-xl border-2 border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Calculator className="size-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Pilih gejala lalu jalankan simulasi untuk melihat detail perhitungan Naive Bayes.
          </p>
        </div>
      )}

      {/* ───── Prior Table ───── */}
      <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="size-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">Probabilitas Prior P(Ck)</h3>
              <p className="text-xs text-muted-foreground">Probabilitas awal setiap penyakit</p>
            </div>
          </div>
          <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Berdasarkan {overview.totalTraining} data training
          </span>
        </div>
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Penyakit</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Jumlah Training
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Rumus</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Prior</th>
              </tr>
            </thead>
            <tbody>
              {overview.priorRows.map((item) => (
                <tr
                  key={item.penyakitId}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle font-medium text-foreground">
                    <span className="text-primary">{item.kode}</span>
                    <span className="mx-1 text-muted-foreground">—</span>
                    {item.nama}
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center justify-center rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                      {item.trainingCount}
                    </span>
                  </td>
                  <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                    {item.trainingCount}/{item.totalTraining || 0}
                  </td>
                  <td className="p-4 align-middle font-semibold text-foreground">{item.prior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───── Likelihood Table ───── */}
      <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <Table className="size-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">Likelihood P(Xi|Ck)</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Nilai likelihood dihitung dengan Laplace smoothing:{" "}
                <span className="font-mono text-xs text-foreground">
                  (jumlah match + 1) / (total kemunculan gejala pada kelas + total gejala)
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Gejala</th>
                {overview.penyakitMaster.map((penyakit) => (
                  <th key={penyakit.id} className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">
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
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle font-medium text-foreground">
                    <span className="text-primary">{row.kode}</span>
                    <span className="mx-1 text-muted-foreground">—</span>
                    {row.nama}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.penyakitId} className="p-4 align-middle text-center">
                      {cell.likelihood === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{cell.likelihood}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
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
      <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">Data Training Aktif</h3>
              <p className="text-xs text-muted-foreground">Dataset yang digunakan oleh klasifikasi</p>
            </div>
          </div>
          <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Total {overview.trainingSamples.length} sampel
          </span>
        </div>

        {overview.trainingSamples.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Database className="size-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">Belum ada data training.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 p-2">
            {overview.trainingSamples.map((item, index) => (
              <div
                key={item.id}
                className="group flex flex-col gap-3 rounded-md p-4 transition-colors hover:bg-muted/50 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground">
                      {overview.trainingSamples.length - index}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.penyakitKode} — {item.penyakitNama}
                      </h4>
                      <p className="text-xs text-muted-foreground">Dibuat {dateFormatter.format(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {item.gejala.map((gejala) => (
                      <span
                        key={gejala.id}
                        className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {gejala.kode} — {gejala.nama}
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
