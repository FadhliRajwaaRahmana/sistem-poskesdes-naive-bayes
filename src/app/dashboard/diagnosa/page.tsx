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
    <section className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="stagger-1 animate-slide-up">
        <div className="flex items-center gap-3 border-b pb-4">
          <Stethoscope className="size-6 text-primary" />
          <h2 className="text-2xl font-semibold text-primary">Input Diagnosa</h2>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Isi data pasien, pilih gejala, lalu sistem akan menghitung hasil diagnosa
          Naive Bayes dan langsung menyimpan riwayatnya.
        </p>
      </div>

      {/* Success Alert */}
      {successMessage ? (
        <div className="stagger-2 animate-scale-in rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
          </div>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <div className="stagger-2 animate-scale-in rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <XCircle className="size-5 shrink-0 text-rose-600" />
            <p className="text-sm font-medium text-rose-800">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="stagger-3 animate-slide-up rounded-md border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b pb-4">
            <User className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">Form Diagnosa Pasien</h3>
          </div>

          <form action={submitDiagnosis} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Tanggal */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="tanggal"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              {/* Nama Pasien */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nama Pasien
                </label>
                <input
                  type="text"
                  name="namaPasien"
                  placeholder="Nama pasien"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              {/* No. Kartu */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  No. Kartu
                </label>
                <input
                  type="text"
                  name="noKartu"
                  placeholder="Nomor kartu pasien"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Umur */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Umur
                </label>
                <input
                  type="number"
                  name="umur"
                  min={0}
                  max={150}
                  placeholder="Umur pasien"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Alamat
              </label>
              <textarea
                name="alamat"
                placeholder="Alamat pasien"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Gejala Selection */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <p className="text-sm font-medium text-foreground">Pilih Gejala</p>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {gejalaList.length} gejala
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gejalaList.map((gejala) => (
                  <label
                    key={gejala.id}
                    className="flex cursor-pointer items-start space-x-3 rounded-md border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      name="gejalaIds"
                      value={gejala.id}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <div className="space-y-1 leading-none">
                      <p className="text-sm font-medium text-foreground">
                        {gejala.kode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gejala.nama}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <Stethoscope className="mr-2 size-4" />
                Proses Diagnosa
              </button>
            </div>
          </form>
        </div>

        {/* Result Card */}
        <div className="stagger-4 animate-slide-up rounded-md border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b pb-4">
            <Award className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">Hasil Terakhir</h3>
          </div>

          {savedDiagnosa ? (
            <div className="mt-6 space-y-6">
              {/* Patient Info */}
              <div className="rounded-md border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Pasien
                    </p>
                    <h4 className="text-lg font-bold text-foreground">
                      {savedDiagnosa.namaPasien}
                    </h4>
                    <div className="pt-2">
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="size-4 text-primary" />
                        <span>
                          Hasil:{" "}
                          <span className="font-semibold text-primary">
                            {savedDiagnosa.hasilDiagnosa}
                          </span>
                        </span>
                      </p>
                      <p className="pl-6 pt-1 text-sm text-muted-foreground">
                        {savedDiagnosa.keterangan}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/dashboard/riwayat?diagnosaId=${savedDiagnosa.id}&print=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Printer className="mr-2 size-4" />
                    Cetak
                  </a>
                </div>
              </div>

              {/* Selected Symptoms */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="text-sm font-medium text-foreground">Gejala Terpilih</p>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {savedDiagnosa.diagnosaGejala.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {savedDiagnosa.diagnosaGejala.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {item.gejala.kode} — {item.gejala.nama}
                    </span>
                  ))}
                </div>
              </div>

              {/* Probability Ranking */}
              <div className="space-y-3">
                <p className="border-b pb-2 text-sm font-medium text-foreground">
                  Ranking Probabilitas
                </p>
                {savedDiagnosa.diagnosaRanking.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {savedDiagnosa.diagnosaRanking.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-border bg-background p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-6 items-center justify-center rounded-md text-xs font-medium ${
                              index === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {item.kodePenyakit} — {item.namaPenyakit}
                          </span>
                        </div>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            index === 0
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {(item.posterior * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                    <Award className="mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Ranking snapshot belum tersedia untuk data diagnosa ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center animate-in fade-in-50">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Stethoscope className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">Belum Ada Hasil</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Belum ada hasil diagnosa yang diproses pada sesi ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
