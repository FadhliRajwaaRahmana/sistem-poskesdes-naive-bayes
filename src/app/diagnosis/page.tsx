import { DiagnosisForm } from "./diagnosis-form";
import { ExportButtons } from "./export-buttons";
import { prisma } from "@/lib/prisma";
import {
  Stethoscope,
  CheckCircle2,
  ShieldAlert,
  HeartPulse,
  BookOpen,
  Lightbulb,
  Award,
  Activity,
  Ruler,
  Baby,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Weight,
  AlertTriangle,
} from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type DiagnosisPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function PublicDiagnosisPage({ searchParams }: DiagnosisPageProps) {
  const params = searchParams ? await searchParams : {};
  const gejalaList = await prisma.gejala.findMany({ orderBy: { kode: "asc" } });
  const diagnosisId = getSearchValue(params.diagnosisId);
  const isPrint = getSearchValue(params.print) === "1";
  const errorMessage = getSearchValue(params.error);
  const successMessage = getSearchValue(params.success);

  const savedDiagnosis = diagnosisId
    ? await prisma.diagnosisBalita.findUnique({
        where: { id: diagnosisId },
        include: {
          penyakit: true,
          diagnosisGejala: {
            include: { gejala: true },
            orderBy: { gejala: { kode: "asc" } },
          },
        },
      })
    : null;

  const isGiziBaik = savedDiagnosis?.hasilDiagnosis === "Gizi Baik";

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  });

  const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  if (isPrint && savedDiagnosis) {
    return (
      <section className="min-h-screen bg-white text-slate-900 font-sans print:p-0 print:m-0 print:h-auto print:min-h-0 print:max-h-full">
        <style>{`
          @media print {
            @page { margin: 8mm 10mm; size: A4 portrait; }
            html, body {
              height: 100% !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 10.5px;
              background: #ffffff !important;
            }
            section {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }
          }
          @media screen {
            section { max-width: 800px; margin: 0 auto; padding: 32px 28px; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener("load",function(){setTimeout(function(){window.print()},400)});` }} />

        {/* Header */}
        <div className="border-b-[3px] border-slate-800 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Sistem Diagnosis Gizi — POSYANDU</p>
              <h1 className="text-xl font-black tracking-tight leading-tight text-slate-900">Laporan Hasil Diagnosis Balita</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">Tanggal Cetak</p>
              <p className="text-xs font-black text-slate-900">{dateFormatter.format(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Hasil Diagnosis */}
        <div className={`rounded-lg p-4 mb-4 border-2 ${
          isGiziBaik
            ? "border-emerald-400 text-emerald-950"
            : "border-rose-400 text-rose-950"
        }`} style={{ backgroundColor: isGiziBaik ? "#ecfdf5" : "#fff1f2" }}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: isGiziBaik ? "#059669" : "#e11d48" }}>
            Hasil Diagnosis
          </p>
          <p className="text-xl font-black tracking-tight" style={{ color: isGiziBaik ? "#065f46" : "#9f1239" }}>
            {savedDiagnosis.hasilDiagnosis}
          </p>
          {savedDiagnosis.keterangan && (
            <p className="mt-1.5 text-[11px] font-semibold leading-snug" style={{ color: isGiziBaik ? "#047857" : "#be123c" }}>
              {savedDiagnosis.keterangan}
            </p>
          )}
        </div>

        {/* Data Balita */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
            Data Balita
          </h2>
          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Balita</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.namaBalita}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">NIK</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.nik}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Jenis Kelamin</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Nama Ibu</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.namaIbu}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Dusun</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.dusun}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Umur</p>
              <p className="font-bold text-slate-900">{savedDiagnosis.umurBulan} bulan</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tanggal Periksa</p>
              <p className="font-bold text-slate-900">{dateFormatter.format(savedDiagnosis.tanggal)}</p>
            </div>
            {savedDiagnosis.tanggalLahir && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tanggal Lahir</p>
                <p className="font-bold text-slate-900">{dateFormatter.format(savedDiagnosis.tanggalLahir)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pengukuran Antropometri */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
            Pengukuran Antropometri
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border-2 border-blue-200 p-2 text-center" style={{ backgroundColor: "#eff6ff" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Berat Badan</p>
              <p className="text-base font-black text-blue-800">{savedDiagnosis.beratBadan} <span className="text-[10px] font-bold text-blue-500">kg</span></p>
            </div>
            <div className="rounded-lg border-2 border-violet-200 p-2 text-center" style={{ backgroundColor: "#f5f3ff" }}>
              <p className="text-[8px] font-black uppercase tracking-widest text-violet-500 mb-0.5">Tinggi Badan</p>
              <p className="text-base font-black text-violet-800">{savedDiagnosis.tinggiBadan} <span className="text-[10px] font-bold text-violet-500">cm</span></p>
            </div>
            {savedDiagnosis.lila !== null && (
              <div className="rounded-lg border-2 border-teal-200 p-2 text-center" style={{ backgroundColor: "#f0fdfa" }}>
                <p className="text-[8px] font-black uppercase tracking-widest text-teal-500 mb-0.5">LiLA</p>
                <p className="text-base font-black text-teal-800">{savedDiagnosis.lila} <span className="text-[10px] font-bold text-teal-500">cm</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Gejala Klinis */}
        {savedDiagnosis.diagnosisGejala.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Gejala Klinis ({savedDiagnosis.diagnosisGejala.length} gejala)
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              {savedDiagnosis.diagnosisGejala.map((g) => (
                <div key={g.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5" style={{ backgroundColor: "#f8fafc" }}>
                  <span className="font-black text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}>{g.gejala.kode}</span>
                  <span className="font-semibold text-slate-700">{g.gejala.nama}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saran Penanganan */}
        {savedDiagnosis.penyakit?.saranPenanganan && (
          <div className="mb-4">
            <h2 className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 pb-1 border-b-2 border-slate-100">
              Saran Penanganan
            </h2>
            <div className="rounded-lg border-2 border-amber-200 p-3 text-[11px] font-medium text-amber-900 leading-relaxed" style={{ backgroundColor: "#fffbeb" }}>
              {savedDiagnosis.penyakit.saranPenanganan}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-[3px] border-slate-800 pt-3 mt-4">
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
            <p>Sistem Diagnosis Gizi Balita — Metode Naive Bayes</p>
            <p>Dicetak: {dateTimeFormatter.format(new Date())}</p>
          </div>
        </div>
      </section>
    );
  }

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
          {errorMessage && (
            <div className="mb-6 rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
                  <AlertTriangle className="size-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900">Gagal Memproses Diagnosis</h4>
                  <p className="text-xs font-bold text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <CheckCircle2 className="size-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900">Diagnosis Berhasil</h4>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

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
              {/* Export Buttons — Prominent */}
              <ExportButtons
                printUrl={`/diagnosis?diagnosisId=${savedDiagnosis.id}&print=1`}
                resultElementId="diagnosis-result"
                fileName={`Diagnosis-${savedDiagnosis.namaBalita.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`}
              />

              {/* Result Content — Capture Target */}
              <div id="diagnosis-result" className="space-y-6 bg-white p-1">
                {/* Patient Info Card */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <div className="relative flex flex-col gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Balita</p>
                      <h4 className="text-2xl font-black text-slate-900">{savedDiagnosis.namaBalita}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</p>
                        </div>
                        <p className="font-bold text-slate-800">{dateFormatter.format(savedDiagnosis.tanggal)}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIK</p>
                        </div>
                        <p className="font-bold text-slate-800">{savedDiagnosis.nik}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Baby className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Kelamin</p>
                        </div>
                        <p className="font-bold text-slate-800">{savedDiagnosis.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Ibu</p>
                        </div>
                        <p className="font-bold text-slate-800">{savedDiagnosis.namaIbu}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dusun</p>
                        </div>
                        <p className="font-bold text-slate-800">{savedDiagnosis.dusun}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3 text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Umur</p>
                        </div>
                        <p className="font-bold text-slate-800">{savedDiagnosis.umurBulan} bulan</p>
                      </div>
                    </div>

                    {/* Antropometri */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                        <Weight className="size-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">BB</p>
                        <p className="text-lg font-black text-blue-700">{savedDiagnosis.beratBadan} <span className="text-xs font-bold">kg</span></p>
                      </div>
                      <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
                        <Ruler className="size-4 text-violet-500 mx-auto mb-1" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-0.5">TB</p>
                        <p className="text-lg font-black text-violet-700">{savedDiagnosis.tinggiBadan} <span className="text-xs font-bold">cm</span></p>
                      </div>
                      {savedDiagnosis.lila !== null && (
                        <div className="rounded-xl bg-teal-50 border border-teal-100 p-3 text-center">
                          <Activity className="size-4 text-teal-500 mx-auto mb-1" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-teal-400 mb-0.5">LiLA</p>
                          <p className="text-lg font-black text-teal-700">{savedDiagnosis.lila} <span className="text-xs font-bold">cm</span></p>
                        </div>
                      )}
                    </div>

                    {savedDiagnosis.tanggalLahir && (
                      <div className="rounded-lg bg-white border border-slate-100 p-3 col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tanggal Lahir</p>
                        <p className="font-bold text-slate-800">{dateFormatter.format(savedDiagnosis.tanggalLahir)}</p>
                      </div>
                    )}

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
                            {savedDiagnosis.hasilDiagnosis}
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
              </div>
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
