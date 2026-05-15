"use client";

import { useCallback, useMemo, useState } from "react";
import { submitDiagnosis } from "@/actions/diagnosis";
import { evaluateAutoSymptoms } from "@/lib/who-standards";
import type { AutoSymptomResult } from "@/lib/who-standards";
import {
  User,
  Ruler,
  CheckCircle2,
  Stethoscope,
  AlertTriangle,
  Info,
} from "lucide-react";

type Gejala = { id: string; kode: string; nama: string };

type DiagnosisFormProps = {
  gejalaList: Gejala[];
};

const AUTO_KODES = new Set(["G01", "G13", "G16"]);

export function DiagnosisForm({ gejalaList }: DiagnosisFormProps) {
  const [umurBulan, setUmurBulan] = useState<number | "">("");
  const [jenisKelamin, setJenisKelamin] = useState<"LAKI_LAKI" | "PEREMPUAN" | "">("");
  const [beratBadan, setBeratBadan] = useState<number | "">("");
  const [tinggiBadan, setTinggiBadan] = useState<number | "">("");
  const [lila, setLila] = useState<number | "">("");

  const autoResult: AutoSymptomResult | null = useMemo(() => {
    if (umurBulan === "" || !jenisKelamin || beratBadan === "" || tinggiBadan === "") {
      return null;
    }
    return evaluateAutoSymptoms(
      umurBulan,
      jenisKelamin as "LAKI_LAKI" | "PEREMPUAN",
      beratBadan,
      tinggiBadan,
      lila === "" ? null : lila,
    );
  }, [umurBulan, jenisKelamin, beratBadan, tinggiBadan, lila]);

  const autoKodeSet = useMemo(
    () => new Set(autoResult?.autoGejalaKodes ?? []),
    [autoResult],
  );

  const autoGejalaIds = useMemo(() => {
    if (!autoResult) return new Set<string>();
    return new Set(
      gejalaList
        .filter((g) => autoKodeSet.has(g.kode))
        .map((g) => g.id),
    );
  }, [autoResult, autoKodeSet, gejalaList]);

  const manualGejalaList = useMemo(
    () => gejalaList.filter((g) => !AUTO_KODES.has(g.kode)),
    [gejalaList],
  );

  const autoGejalaList = useMemo(
    () => gejalaList.filter((g) => AUTO_KODES.has(g.kode)),
    [gejalaList],
  );

  const showLila = typeof umurBulan === "number" && umurBulan >= 12;

  const numVal = useCallback((v: string) => {
    const n = Number(v);
    return v === "" || Number.isNaN(n) ? ("" as const) : n;
  }, []);

  return (
    <form action={submitDiagnosis} className="mt-8 space-y-10">
      {/* Section 1: Data Balita */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-primary">
            <User className="size-5 stroke-[2.5]" />
          </div>
          <h4 className="text-lg font-black text-slate-800">Data Balita</h4>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Tanggal</label>
            <input
              type="date"
              name="tanggal"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input-field"
              required
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Nama Balita</label>
            <input
              type="text"
              name="namaBalita"
              placeholder="Masukkan nama lengkap balita"
              className="input-field"
              required
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">NIK</label>
            <input
              type="text"
              name="nik"
              placeholder="Nomor Induk Kependudukan"
              className="input-field"
              required
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Jenis Kelamin</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="LAKI_LAKI"
                  checked={jenisKelamin === "LAKI_LAKI"}
                  onChange={() => setJenisKelamin("LAKI_LAKI")}
                  className="size-5 accent-[var(--primary)]"
                  required
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">Laki-laki</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="PEREMPUAN"
                  checked={jenisKelamin === "PEREMPUAN"}
                  onChange={() => setJenisKelamin("PEREMPUAN")}
                  className="size-5 accent-[var(--primary)]"
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">Perempuan</span>
              </label>
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Nama Ibu</label>
            <input
              type="text"
              name="namaIbu"
              placeholder="Masukkan nama ibu"
              className="input-field"
              required
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Dusun</label>
            <input
              type="text"
              name="dusun"
              placeholder="Contoh: Sei Jambu"
              className="input-field"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 2: Pengukuran */}
      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-amber-100 border border-amber-200 p-2.5 text-amber-600">
            <Ruler className="size-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800">Pengukuran Antropometri</h4>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Data pengukuran akan dicocokkan dengan standar WHO</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Umur (Bulan)</label>
            <div className="relative">
              <input
                type="number"
                name="umurBulan"
                min={0}
                max={60}
                placeholder="0-60"
                value={umurBulan}
                onChange={(e) => setUmurBulan(numVal(e.target.value))}
                className="input-field pr-16"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">bulan</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Berat Badan</label>
            <div className="relative">
              <input
                type="number"
                name="beratBadan"
                min={0.1}
                max={50}
                step={0.1}
                placeholder="Contoh: 8.5"
                value={beratBadan}
                onChange={(e) => setBeratBadan(numVal(e.target.value))}
                className="input-field pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">kg</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Tinggi Badan</label>
            <div className="relative">
              <input
                type="number"
                name="tinggiBadan"
                min={1}
                max={150}
                step={0.1}
                placeholder="Contoh: 68.5"
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(numVal(e.target.value))}
                className="input-field pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">cm</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">
              LiLA {!showLila && <span className="text-slate-400 font-medium">(usia &ge; 12 bln)</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                name="lila"
                min={0}
                max={30}
                step={0.1}
                placeholder={showLila ? "Contoh: 12.5" : "Tidak berlaku"}
                value={lila}
                onChange={(e) => setLila(numVal(e.target.value))}
                className="input-field pr-12"
                disabled={!showLila}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">cm</span>
            </div>
          </div>
        </div>

        {/* WHO Preprocessing Result */}
        {autoResult && (
          <div className="mt-6 space-y-3">
            {autoResult.standarUsed && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="size-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Standar WHO (checkpoint {autoResult.standarUsed.umurBulan} bulan)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                  <span>BB Normal: {autoResult.standarUsed.bbMin} - {autoResult.standarUsed.bbMax} kg</span>
                  <span>TB Normal: {autoResult.standarUsed.tbMin} - {autoResult.standarUsed.tbMax} cm</span>
                </div>
              </div>
            )}

            {autoResult.autoGejalaKodes.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="size-4 text-rose-600" />
                  <span className="text-sm font-bold text-rose-800">Gejala Terdeteksi Otomatis</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {autoResult.autoGejalaKodes.map((kode) => {
                    const gejala = gejalaList.find((g) => g.kode === kode);
                    return (
                      <span key={kode} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-800">
                        <span className="font-black">{kode}</span>
                        {gejala && <span className="text-rose-600">- {gejala.nama}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {autoResult.lilaStatus === "peringatan" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                <p className="text-sm font-bold text-amber-800">
                  LiLA dalam rentang peringatan (11.5 - 12.5 cm). Perlu pemantauan lebih lanjut.
                </p>
              </div>
            )}

            {autoResult.autoGejalaKodes.length === 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-800">
                  Semua pengukuran dalam batas normal menurut standar WHO.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Gejala Klinis */}
      <div className="pt-8 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-secondary/10 border border-secondary/20 p-2.5 text-secondary">
              <Stethoscope className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800">Gejala Klinis</h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pilih gejala yang dialami balita</p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
            Total {gejalaList.length} Gejala
          </span>
        </div>

        {/* Auto-detected gejala (hidden inputs) */}
        {autoGejalaList.map((gejala) => {
          const isAuto = autoGejalaIds.has(gejala.id);
          if (!isAuto) return null;
          return (
            <input key={`auto-${gejala.id}`} type="hidden" name="gejalaIds" value={gejala.id} />
          );
        })}

        {/* Auto gejala display */}
        {autoGejalaList.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Gejala Otomatis (dari pengukuran)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {autoGejalaList.map((gejala) => {
                const isAuto = autoGejalaIds.has(gejala.id);
                return (
                  <div
                    key={gejala.id}
                    className={`flex items-start space-x-3 rounded-xl border p-4 shadow-sm transition-all duration-300 ${
                      isAuto
                        ? "border-rose-200 bg-rose-50"
                        : "border-slate-200 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <div className={`size-5 rounded-md border-2 flex items-center justify-center ${
                        isAuto
                          ? "border-rose-500 bg-rose-500"
                          : "border-slate-300 bg-white"
                      }`}>
                        {isAuto && <CheckCircle2 className="size-4 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="space-y-1.5 leading-none flex-1">
                      <p className={`text-sm font-black ${isAuto ? "text-rose-700" : "text-slate-500"}`}>
                        {gejala.kode}
                      </p>
                      <p className={`text-xs font-semibold leading-relaxed ${isAuto ? "text-rose-600" : "text-slate-400"}`}>
                        {gejala.nama}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual gejala checkboxes */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Gejala Manual (pilih yang dialami)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-2 clean-scroll p-1">
            {manualGejalaList.map((gejala) => (
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
      </div>

      {/* Submit */}
      <div className="flex pt-8 mt-4 border-t border-slate-100">
        <button
          type="submit"
          className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 px-8 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <Stethoscope className="mr-3 size-5 stroke-[2.5]" />
          Proses Diagnosis Naive Bayes
        </button>
      </div>
    </form>
  );
}
