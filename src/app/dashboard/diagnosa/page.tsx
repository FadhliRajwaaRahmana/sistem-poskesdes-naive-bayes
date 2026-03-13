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
            <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">Input Diagnosa Pasien</h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-300">
              Isi data pasien dan pilih gejala klinis yang dialami. Sistem akan menganalisa
              probabilitas penyakit menggunakan algoritma Naive Bayes secara real-time dan presisi.
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="stagger-2 animate-scale-in rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 shadow-sm border border-emerald-200">
            <CheckCircle2 className="size-6 shrink-0 stroke-[2.5]" />
          </div>
          <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="stagger-2 animate-scale-in rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-rose-100 p-2 text-rose-600 shadow-sm border border-rose-200">
            <XCircle className="size-6 shrink-0 stroke-[2.5]" />
          </div>
          <p className="text-sm font-bold text-rose-800">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
        {/* Form Card */}
        <div className="stagger-3 animate-slide-up card-container">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-primary shadow-sm">
              <User className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Data Pasien & Gejala</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">Lengkapi form di bawah ini.</p>
            </div>
          </div>

          <form action={submitDiagnosis} className="mt-8 space-y-8">
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
            <div className="space-y-5 pt-8 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h4 className="text-lg font-black text-slate-800">Daftar Gejala Klinis</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Pilih gejala-gejala yang sedang dialami oleh pasien.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                  Total {gejalaList.length} Gejala
                </span>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto pr-2 clean-scroll p-1">
                {gejalaList.map((gejala) => (
                  <label
                    key={gejala.id}
                    className="group flex cursor-pointer items-start space-x-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-md"
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
                    <div className="space-y-1.5 leading-none flex-1">
                      <p className="text-sm font-black text-slate-700 group-has-[:checked]:text-primary transition-colors">
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
            <div className="flex pt-8 mt-8 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 px-8 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                <Stethoscope className="mr-3 size-5 stroke-[2.5]" />
                Proses Diagnosa Naive Bayes
              </button>
            </div>
          </form>
        </div>

        {/* Result Card */}
        <div className="stagger-4 animate-slide-up card-container h-fit sticky top-24">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="rounded-2xl bg-amber-100 border border-amber-200 p-3 text-amber-600 shadow-sm">
              <Award className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hasil Analisis</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">Laporan diagnosa terbaru.</p>
            </div>
          </div>

          {savedDiagnosa ? (
            <div className="mt-8 space-y-8">
              {/* Patient Info */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Data Pasien
                      </p>
                      <h4 className="text-2xl font-black text-slate-900">
                        {savedDiagnosa.namaPasien}
                      </h4>
                    </div>
                    <a
                      href={`/dashboard/riwayat?diagnosaId=${savedDiagnosa.id}&print=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-primary hover:text-primary hover:bg-slate-50 active:scale-95 shrink-0"
                    >
                      <Printer className="mr-2 size-4" />
                      Cetak Hasil
                    </a>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="size-5" strokeWidth={3} />
                      </div>
                      <span className="font-bold text-slate-600 text-base">
                        Hasil:{" "}
                        <span className="text-emerald-600 text-xl ml-1 font-black bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                          {savedDiagnosa.hasilDiagnosa}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      {savedDiagnosa.keterangan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Symptoms */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Gejala Terpilih</p>
                  <span className="rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-bold border border-slate-200">
                    {savedDiagnosa.diagnosaGejala.length} Gejala
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedDiagnosa.diagnosaGejala.map((item) => (
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

              {/* Probability Ranking */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800">
                  Ranking Probabilitas
                </p>
                {savedDiagnosa.diagnosaRanking.length > 0 ? (
                  <div className="space-y-3">
                    {savedDiagnosa.diagnosaRanking.map((item, index) => (
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
                          {(item.posterior * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <Award className="size-8 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      Ranking snapshot belum tersedia.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
                <Stethoscope className="size-10 text-slate-300 stroke-[2]" />
              </div>
              <p className="text-xl font-black text-slate-800">Belum Ada Hasil</p>
              <p className="mt-3 text-sm font-bold text-slate-500 max-w-[250px] leading-relaxed">
                Silakan isi form pasien dan pilih gejala klinis untuk memproses hasil analisis.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
