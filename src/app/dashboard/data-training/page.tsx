import { createTraining, deleteTraining } from "@/actions/master-data";
import { prisma } from "@/lib/prisma";
import { Database, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type DataTrainingPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getFlashMessage(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function DataTrainingPage({ searchParams }: DataTrainingPageProps) {
  const [params, penyakitList, gejalaList, trainingList] = await Promise.all([
    searchParams ? searchParams : Promise.resolve<PageSearchParams>({}),
    prisma.penyakit.findMany({ orderBy: { kode: "asc" } }),
    prisma.gejala.findMany({ orderBy: { kode: "asc" } }),
    prisma.dataTraining.findMany({
      include: {
        penyakit: true,
        trainingGejala: {
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
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const successMessage = getFlashMessage(params.success);
  const errorMessage = getFlashMessage(params.error);

  return (
    <section className="animate-fade-in space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-5 rounded-2xl bg-slate-900 px-8 py-10 text-white shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-sm">
          <Database className="size-8" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Data Training</h2>
          <p className="mt-2 text-base text-slate-300">
            Kelola sampel training yang dipakai untuk proses perhitungan Naive Bayes.
          </p>
        </div>
      </div>

      {/* ── Flash Messages ── */}
      {successMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-slide-up flex items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
          <XCircle className="size-5 shrink-0 text-rose-600" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      ) : null}

      {/* ── Add Training Form ── */}
      <div className="card-container animate-slide-up stagger-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus className="size-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Tambah Data Training</h3>
        </div>

        <form action={createTraining} className="space-y-6">
          {/* Disease Select */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Penyakit
            </label>
            <select
              name="penyakitId"
              className="input-field"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Pilih penyakit
              </option>
              {penyakitList.map((penyakit) => (
                <option key={penyakit.id} value={penyakit.id}>
                  {penyakit.kode} - {penyakit.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Symptom Checkbox Grid */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">Gejala</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gejalaList.map((gejala) => (
                <label
                  key={gejala.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    name="gejalaIds"
                    value={gejala.id}
                    className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
                  />
                  <span className="grid gap-1 leading-none">
                    <span className="font-bold text-slate-800">{gejala.kode}</span>
                    <span className="text-sm font-medium text-slate-500">{gejala.nama}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="mr-2 size-5" />
              Simpan Data Training
            </button>
          </div>
        </form>
      </div>

      {/* ── Training List ── */}
      <div className="animate-slide-up stagger-2 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold tracking-tight text-slate-800">Daftar Data Training</h3>
          <span className="inline-flex items-center rounded-full border-2 border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
            {trainingList.length} sampel
          </span>
        </div>

        {trainingList.length === 0 ? (
          <div className="card-container flex flex-col items-center justify-center p-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 border-2 border-slate-200">
              <Database className="size-10 text-slate-400" />
            </div>
            <p className="mt-5 text-lg font-bold text-slate-800">Belum ada data training</p>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">
              Tambahkan sampel training pertama menggunakan form di atas untuk memulai analisis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainingList.map((training, index) => (
              <div
                key={training.id}
                className="card-container group p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-4">
                    {/* Header with inline sample badge */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                        <h4 className="text-xl font-bold text-slate-800">
                          {training.penyakit.kode} - {training.penyakit.nama}
                        </h4>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        #{trainingList.length - index}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-500">
                      Ditambahkan pada {dateFormatter.format(training.createdAt)}
                    </p>

                    {/* Symptom Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {training.trainingGejala.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"
                        >
                          {item.gejala.kode} - {item.gejala.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <form action={deleteTraining} className="shrink-0 pt-2 lg:pt-0">
                    <input type="hidden" name="id" value={training.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50 active:scale-95 border-2 border-rose-100 hover:border-rose-200"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Hapus Sampel
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
