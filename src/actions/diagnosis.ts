"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateDiagnosis } from "@/lib/naive-bayes";
import { parseDiagnosisDate, resolveSelectedGejala } from "@/lib/diagnosis-validation";
import { getDiagnosisActionErrorMessage } from "@/lib/prisma-action-errors";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdminSession } from "@/lib/session";
import { evaluateAutoSymptoms } from "@/lib/who-standards";

const diagnosisPath = "/diagnosis";

const diagnosisInputSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  namaBalita: z.string().trim().min(1, "Nama balita wajib diisi.").max(100),
  nik: z.string().trim().min(1, "NIK wajib diisi.").max(30),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"], { message: "Jenis kelamin wajib dipilih." }),
  namaIbu: z.string().trim().min(1, "Nama ibu wajib diisi.").max(100),
  dusun: z.string().trim().min(1, "Dusun wajib diisi.").max(100),
  tanggalLahir: z.string().optional(),
  umurBulan: z.coerce.number().int().min(0, "Umur tidak valid.").max(60, "Umur maksimal 60 bulan."),
  beratBadan: z.coerce.number().min(0.1, "Berat badan tidak valid.").max(50),
  tinggiBadan: z.coerce.number().min(1, "Tinggi badan tidak valid.").max(150),
  lila: z.coerce.number().min(0).max(30).optional().nullable(),
  gejalaIds: z.array(z.string().trim().min(1)),
});

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function getOptionalNumber(value: FormDataEntryValue | null): number | null {
  const str = typeof value === "string" ? value.trim() : "";
  if (str === "") return null;
  const num = Number(str);
  return Number.isNaN(num) ? null : num;
}

function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function submitDiagnosis(formData: FormData) {
  const session = await getSession();

  const parsed = diagnosisInputSchema.safeParse({
    tanggal: getStringValue(formData.get("tanggal")),
    namaBalita: getStringValue(formData.get("namaBalita")),
    nik: getStringValue(formData.get("nik")),
    jenisKelamin: getStringValue(formData.get("jenisKelamin")),
    namaIbu: getStringValue(formData.get("namaIbu")),
    dusun: getStringValue(formData.get("dusun")),
    tanggalLahir: getStringValue(formData.get("tanggalLahir")) || undefined,
    umurBulan: getStringValue(formData.get("umurBulan")),
    beratBadan: getStringValue(formData.get("beratBadan")),
    tinggiBadan: getStringValue(formData.get("tinggiBadan")),
    lila: getOptionalNumber(formData.get("lila")),
    gejalaIds: Array.from(
      new Set(
        formData
          .getAll("gejalaIds")
          .map((v) => getStringValue(v))
          .filter(Boolean),
      ),
    ),
  });

  if (!parsed.success) {
    redirectWithMessage(diagnosisPath, "error", parsed.error.issues[0]?.message ?? "Input diagnosis tidak valid.");
  }

  const data = parsed.data;
  const waktuLokal = getStringValue(formData.get("waktuLokal"));
  const diagnosisDate = parseDiagnosisDate(data.tanggal, waktuLokal || undefined);

  if (!diagnosisDate) {
    redirectWithMessage(diagnosisPath, "error", "Tanggal diagnosis tidak valid.");
  }

  let tanggalLahirDate: Date | null = null;
  if (data.tanggalLahir) {
    const parsed = new Date(data.tanggalLahir);
    if (!Number.isNaN(parsed.getTime())) {
      tanggalLahirDate = parsed;
    }
  }

  const autoResult = evaluateAutoSymptoms(
    data.umurBulan,
    data.jenisKelamin,
    data.beratBadan,
    data.tinggiBadan,
    data.lila ?? null,
  );

  const autoGejalaCodes = autoResult.autoGejalaKodes;
  let autoGejalaIds: string[] = [];
  if (autoGejalaCodes.length > 0) {
    const autoGejalaRecords = await prisma.gejala.findMany({
      where: { kode: { in: autoGejalaCodes } },
      select: { id: true },
    });
    autoGejalaIds = autoGejalaRecords.map((g) => g.id);
  }

  const allGejalaIds = Array.from(new Set([...autoGejalaIds, ...data.gejalaIds]));
  const isGiziBaikCase = allGejalaIds.length === 0;

  let hasilDiagnosis: string;
  let penyakitId: string | null = null;
  let keterangan: string | null = null;
  let diagnosisGejalaCreate: { gejalaId: string }[] = [];
  let diagnosisRankingCreate: {
    penyakitId: string | null;
    kodePenyakit: string;
    namaPenyakit: string;
    prior: number;
    posterior: number;
    score: number;
    peringkat: number;
  }[] = [];

  if (isGiziBaikCase) {
    hasilDiagnosis = "Gizi Baik";
    keterangan = "Semua pengukuran dalam batas normal, tidak ada gejala klinis.";
  } else {
    const availableGejala = await prisma.gejala.findMany({
      where: { id: { in: allGejalaIds } },
      select: { id: true, kode: true, nama: true },
    });

    const { selectedIds } = resolveSelectedGejala(allGejalaIds, availableGejala);

    if (selectedIds.length === 0) {
      redirectWithMessage(diagnosisPath, "error", "Gejala yang dipilih tidak valid.");
    }

    let diagnosis;
    try {
      diagnosis = await calculateDiagnosis(selectedIds);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        redirectWithMessage(diagnosisPath, "error", getDiagnosisActionErrorMessage(error.code));
      }
      redirectWithMessage(diagnosisPath, "error", "Gagal memproses diagnosis.");
    }

    hasilDiagnosis = diagnosis.resultText;
    penyakitId = diagnosis.topResult?.penyakitId ?? null;
    keterangan = diagnosis.saranPenanganan || null;

    diagnosisGejalaCreate = selectedIds.map((gejalaId) => ({ gejalaId }));
    diagnosisRankingCreate = diagnosis.ranked.map((item) => ({
      penyakitId: item.penyakitId,
      kodePenyakit: item.kodePenyakit,
      namaPenyakit: item.namaPenyakit,
      prior: item.prior,
      posterior: item.posterior,
      score: item.score,
      peringkat: item.peringkat,
    }));
  }

  let savedDiagnosis;

  try {
    savedDiagnosis = await prisma.diagnosisBalita.create({
      data: {
        tanggal: diagnosisDate,
        namaBalita: data.namaBalita,
        nik: data.nik,
        jenisKelamin: data.jenisKelamin,
        namaIbu: data.namaIbu,
        dusun: data.dusun,
        tanggalLahir: tanggalLahirDate,
        umurBulan: data.umurBulan,
        beratBadan: data.beratBadan,
        tinggiBadan: data.tinggiBadan,
        lila: data.lila ?? null,
        hasilDiagnosis,
        penyakitId,
        keterangan,
        userId: session?.user?.id ?? null,
        diagnosisGejala: {
          create: diagnosisGejalaCreate,
        },
        diagnosisRanking: {
          create: diagnosisRankingCreate,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      redirectWithMessage(diagnosisPath, "error", getDiagnosisActionErrorMessage(error.code));
    }
    redirectWithMessage(diagnosisPath, "error", "Gagal menyimpan hasil diagnosis.");
  }

  revalidatePath(diagnosisPath);
  revalidatePath("/dashboard/riwayat-diagnosis");
  revalidatePath("/dashboard");

  redirect(`${diagnosisPath}?success=${encodeURIComponent("Diagnosis berhasil diproses dan disimpan.")}&diagnosisId=${savedDiagnosis.id}`);
}

export async function deleteDiagnosis(id: string) {
  await requireAdminSession();
  await prisma.diagnosisBalita.delete({ where: { id } });
  revalidatePath("/dashboard/riwayat-diagnosis");
  revalidatePath("/dashboard");
}
