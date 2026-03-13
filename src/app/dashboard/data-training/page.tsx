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
    <section className="animate-fade-in space-y-8 pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <Database className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Data Training</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Kelola sampel dataset yang akan menjadi dasar pengetahuan sistem dalam menghitung probabilitas Naive Bayes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Flash Messages ── */}
      {successMessage ? (
        <div className="animate-slide-down flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-emerald-100 p-2 border border-emerald-200">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-emerald-800">{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-slide-down flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-2 border border-rose-200">
            <XCircle className="size-5 shrink-0 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-800">{errorMessage}</span>
        </div>
      ) : null}

      {/* ── Add Training Form ── */}
      <div className="card-container animate-slide-up stagger-1">
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl border border-amber-200">
            <Plus className="size-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Data Training</h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Pilih penyakit dan hubungkan dengan gejala.</p>
          </div>
        </div>

        <form action={createTraining} className="space-y-6 border-t border-slate-100 pt-6">
          {/* Disease Select */}
          <div className="space-y-2 max-w-xl">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
              Penyakit Tujuan
            </label>
            <select
              name="penyakitId"
              className="input-field h-12 font-bold cursor-pointer"
              defaultValue=""
              required
            >
              <option value="" disabled>
                -- Pilih Penyakit --
              </option>
              {penyakitList.map((penyakit) => (
                <option key={penyakit.id} value={penyakit.id}>
                  {penyakit.kode} - {penyakit.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Symptom Checkbox Grid */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1 mb-2">Pilih Gejala Terkait</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 max-h-[400px] overflow-y-auto pr-2 clean-scroll p-1">
              {gejalaList.map((gejala) => (
                <label
                  key={gejala.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-md"
                >
                  <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        name="gejalaIds"
                        value={gejala.id}
                        className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all checked:border-primary checked:bg-primary hover:border-primary/50"
                      />
                      <CheckCircle2 className="pointer-events-none absolute size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
                    </div>
                  <span className="grid gap-1.5 leading-none flex-1">
                    <span className="text-sm font-black text-slate-700 group-has-[:checked]:text-primary transition-colors">{gejala.kode}</span>
                    <span className="text-xs font-semibold text-slate-500 leading-relaxed group-has-[:checked]:text-slate-700">{gejala.nama}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
            <button
              type="submit"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
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
          <h3 className="text-xl font-black tracking-tight text-slate-800">Daftar Data Training</h3>
          <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            Total {trainingList.length} Sampel
          </span>
        </div>

        {trainingList.length === 0 ? (
          <div className="card-container flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 bg-white">
            <div className="rounded-3xl bg-slate-100 p-5 border border-slate-200 mb-5 shadow-sm">
              <Database className="size-10 text-slate-400" />
            </div>
            <p className="text-lg font-black text-slate-800">Belum Ada Data Training</p>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">
              Tambahkan sampel training pertama menggunakan form di atas agar sistem Naive Bayes dapat mulai bekerja.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainingList.map((training, index) => (
              <div
                key={training.id}
                className={`animate-slide-up stagger-${Math.min(index + 1, 8)} card-container !p-6 group transition-all duration-300 hover:border-primary/30 hover:shadow-md`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs border border-primary/20">
                          #{trainingList.length - index}
                        </div>
                        <h4 className="text-lg font-black text-slate-900">
                          <span className="text-slate-400 mr-1.5">{training.penyakit.kode}</span> {training.penyakit.nama}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Ditambahkan pada {dateFormatter.format(training.createdAt)}
                    </p>

                    {/* Symptom Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {training.trainingGejala.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                        >
                          <span className="text-primary mr-1.5">{item.gejala.kode}</span> {item.gejala.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <form action={deleteTraining} className="shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 mt-2 lg:mt-0">
                    <input type="hidden" name="id" value={training.id} />
                    <button
                      type="submit"
                      className="inline-flex h-10 w-full lg:w-auto items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50 active:scale-95 border border-rose-200 hover:border-rose-300 shadow-sm"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Hapus
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
