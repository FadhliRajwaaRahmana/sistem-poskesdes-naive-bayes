import { submitDiagnosis } from "@/actions/diagnosa";
import { prisma } from "@/lib/prisma";
import {
  Stethoscope,
  User,
  CheckCircle2,
  XCircle,
  Printer,
  Award,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type DiagnosaPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function getFlashMessage(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function DiagnosaPage({ searchParams }: DiagnosaPageProps) {
  const params = searchParams ? await searchParams : {};
  const gejalaList = await prisma.gejala.findMany({ orderBy: { kode: "asc" } });
  const diagnosaId = getSearchValue(params.diagnosaId);

  const savedDiagnosa = diagnosaId
    ? await prisma.diagnosaPasien.findUnique({
        where: { id: diagnosaId },
        include: {
          penyakit: true,
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
          diagnosaRanking: {
            orderBy: {
              peringkat: "asc",
            },
          },
        },
      })
    : null;

  const successMessage = getFlashMessage(params.success);
  const errorMessage = getFlashMessage(params.error);

  return (
    <section className="animate-fade-in space-y-8 pb-12">
      {/* Page Header */}
      <div className="stagger-1 animate-slide-down">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-8 py-10 shadow-lg sm:px-12 sm:py-14">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Stethoscope className="size-64 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200 backdrop-blur-sm border border-indigo-500/30">
              <Stethoscope className="size-3.5" />
              <span>Sistem Pakar Naive Bayes</span>
            </div>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Input Diagnosa Pasien</h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
              Isi data pasien dan pilih gejala klinis yang dialami. Sistem akan menganalisa
              probabilitas penyakit menggunakan algoritma Naive Bayes secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="stagger-2 animate-scale-in rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="size-5 shrink-0 stroke-[2.5]" />
            </div>
            <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
          </div>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="stagger-2 animate-scale-in rounded-2xl border-2 border-rose-500 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
              <XCircle className="size-5 shrink-0 stroke-[2.5]" />
            </div>
            <p className="text-sm font-bold text-rose-800">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Form Card */}
        <div className="stagger-3 animate-slide-up card-container">
          <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-5">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <User className="size-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Data Pasien & Gejala</h3>
          </div>

          <form action={submitDiagnosis} className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tanggal */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="tanggal"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="input-field"
                  required
                />
              </div>

              {/* Nama Pasien */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Nama Pasien
                </label>
                <input
                  type="text"
                  name="namaPasien"
                  placeholder="Masukkan nama lengkap pasien"
                  className="input-field"
                  required
                />
              </div>

              {/* No. Kartu */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  No. Kartu <span className="text-slate-400 font-medium">(Opsional)</span>
                </label>
                <input
                  type="text"
                  name="noKartu"
                  placeholder="Contoh: 000123456"
                  className="input-field"
                />
              </div>

              {/* Umur */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Umur
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="umur"
                    min={0}
                    max={150}
                    placeholder="Contoh: 25"
                    className="input-field pr-12"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                    Thn
                  </span>
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Alamat
              </label>
              <textarea
                name="alamat"
                placeholder="Masukkan alamat lengkap pasien"
                className="input-field min-h-[100px] resize-y"
              />
            </div>

            {/* Gejala Selection */}
            <div className="space-y-4 pt-6 border-t-2 border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h4 className="text-base font-bold text-slate-800">Daftar Gejala Klinis</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Pilih gejala-gejala yang sedang dialami oleh pasien.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                  Total {gejalaList.length} Gejala
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gejalaList.map((gejala) => (
                  <label
                    key={gejala.id}
                    className="group flex cursor-pointer items-start space-x-3 rounded-xl border-2 border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-primary hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-md"
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        name="gejalaIds"
                        value={gejala.id}
                        className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all checked:border-primary checked:bg-primary hover:border-primary/50"
                      />
                      <CheckCircle2 className="pointer-events-none absolute size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3.5} />
                    </div>
                    <div className="space-y-1 leading-none flex-1">
                      <p className="text-sm font-bold text-slate-700 group-has-[:checked]:text-primary transition-colors">
                        {gejala.kode}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed group-has-[:checked]:text-slate-700">
                        {gejala.nama}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex pt-8 mt-8 border-t-2 border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
              >
                <Stethoscope className="mr-2.5 size-5 stroke-[2.5]" />
                Proses Diagnosa
              </button>
            </div>
          </form>
        </div>

        {/* Result Card */}
        <div className="stagger-4 animate-slide-up card-container h-fit">
          <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-5">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <Award className="size-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Hasil Analisis Terakhir</h3>
          </div>

          {savedDiagnosa ? (
            <div className="mt-8 space-y-8">
              {/* Patient Info */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Data Pasien
                    </p>
                    <h4 className="text-2xl font-black text-slate-800">
                      {savedDiagnosa.namaPasien}
                    </h4>
                    <div className="pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="rounded-full bg-emerald-100 p-1 text-emerald-600">
                          <CheckCircle2 className="size-4" strokeWidth={3} />
                        </div>
                        <span className="font-bold text-slate-600">
                          Hasil:{" "}
                          <span className="text-emerald-600 text-lg ml-1">
                            {savedDiagnosa.hasilDiagnosa}
                          </span>
                        </span>
                      </div>
                      <p className="pl-8 pt-2 text-sm font-semibold text-slate-600 leading-relaxed max-w-sm">
                        {savedDiagnosa.keterangan}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/dashboard/riwayat?diagnosaId=${savedDiagnosa.id}&print=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white border-2 border-slate-200 px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
                  >
                    <Printer className="mr-2.5 size-4 stroke-[2.5]" />
                    Cetak Hasil
                  </a>
                </div>
              </div>

              {/* Selected Symptoms */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                  <p className="text-sm font-bold text-slate-800">Gejala Terpilih</p>
                  <span className="rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-bold border border-slate-200">
                    {savedDiagnosa.diagnosaGejala.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {savedDiagnosa.diagnosaGejala.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center rounded-lg border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                    >
                      <span className="text-primary mr-1.5">{item.gejala.kode}</span>
                      {item.gejala.nama}
                    </span>
                  ))}
                </div>
              </div>

              {/* Probability Ranking */}
              <div className="space-y-4">
                <p className="border-b-2 border-slate-100 pb-3 text-sm font-bold text-slate-800">
                  Ranking Probabilitas (Naive Bayes)
                </p>
                {savedDiagnosa.diagnosaRanking.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {savedDiagnosa.diagnosaRanking.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex size-10 items-center justify-center rounded-xl text-sm font-black shadow-sm border-2 ${
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
                            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                              Kode: {item.kodePenyakit}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-black shadow-sm border-2 ${
                            index === 0
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-white"
                          }`}
                        >
                          {(item.posterior * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <div className="rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm mb-4">
                      <Award className="size-6 text-slate-400 stroke-[2.5]" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      Ranking snapshot belum tersedia untuk data diagnosa ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm mb-6">
                <Stethoscope className="size-8 text-primary stroke-[2.5]" />
              </div>
              <p className="text-lg font-black text-slate-800">Belum Ada Hasil</p>
              <p className="mt-2 text-sm font-bold text-slate-500 max-w-sm leading-relaxed">
                Silakan isi form di samping dan pilih gejala klinis untuk melihat hasil analisis.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
