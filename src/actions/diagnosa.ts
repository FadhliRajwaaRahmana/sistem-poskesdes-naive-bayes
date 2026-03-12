"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDiagnosisComputation } from "@/lib/naive-bayes";
import { parseDiagnosisDate, resolveSelectedGejala } from "@/lib/diagnosa-validation";
import { getDiagnosisActionErrorMessage } from "@/lib/prisma-action-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

const diagnosaPath = "/dashboard/diagnosa";
const riwayatPath = "/dashboard/riwayat";
const staleGejalaMessage = "Gejala yang dipilih sudah berubah. Silakan pilih ulang gejala lalu proses diagnosa lagi.";

const diagnosaInputSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  namaPasien: z.string().trim().min(1, "Nama pasien wajib diisi.").max(100, "Nama pasien maksimal 100 karakter."),
  noKartu: z.string().trim().max(50, "No kartu maksimal 50 karakter.").optional(),
  umur: z.coerce.number().int().min(0, "Umur tidak valid.").max(150, "Umur tidak valid."),
  alamat: z.string().trim().max(255, "Alamat maksimal 255 karakter.").optional(),
  gejalaIds: z.array(z.string().trim().min(1)).min(1, "Pilih minimal satu gejala."),
});

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function getOptionalString(value: FormDataEntryValue | null) {
  const result = getStringValue(value).trim();
  return result.length > 0 ? result : undefined;
}

function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function submitDiagnosis(formData: FormData) {
  const session = await requireAdminSession();

  const parsed = diagnosaInputSchema.safeParse({
    tanggal: getStringValue(formData.get("tanggal")),
    namaPasien: getStringValue(formData.get("namaPasien")),
    noKartu: getOptionalString(formData.get("noKartu")),
    umur: getStringValue(formData.get("umur")),
    alamat: getOptionalString(formData.get("alamat")),
    gejalaIds: Array.from(new Set(formData.getAll("gejalaIds").map((value) => getStringValue(value)).filter(Boolean))),
  });

  if (!parsed.success) {
    redirectWithMessage(diagnosaPath, "error", parsed.error.issues[0]?.message ?? "Input diagnosa tidak valid.");
  }

  const data = parsed.data;
  const diagnosisDate = parseDiagnosisDate(data.tanggal);

  if (!diagnosisDate) {
    redirectWithMessage(diagnosaPath, "error", "Tanggal diagnosa tidak valid.");
  }

  let availableGejala: Array<{
    id: string;
    kode: string;
    nama: string;
  }>;

  try {
    availableGejala = await prisma.gejala.findMany({
      where: {
        id: {
          in: data.gejalaIds,
        },
      },
      select: {
        id: true,
        kode: true,
        nama: true,
      },
    });
  } catch {
    redirectWithMessage(diagnosaPath, "error", "Gagal memuat data gejala untuk proses diagnosa.");
  }

  const { selectedIds, missingIds } = resolveSelectedGejala(data.gejalaIds, availableGejala);

  if (missingIds.length > 0 || selectedIds.length === 0) {
    redirectWithMessage(diagnosaPath, "error", staleGejalaMessage);
  }

  let diagnosis;

  try {
    diagnosis = await getDiagnosisComputation(selectedIds);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      redirectWithMessage(diagnosaPath, "error", getDiagnosisActionErrorMessage(error.code));
    }

    redirectWithMessage(diagnosaPath, "error", "Gagal memproses diagnosa pasien.");
  }

  if (diagnosis.selectedGejala.length === 0) {
    redirectWithMessage(diagnosaPath, "error", staleGejalaMessage);
  }

  let savedDiagnosa;

  try {
    savedDiagnosa = await prisma.diagnosaPasien.create({
      data: {
        tanggal: diagnosisDate,
        namaPasien: data.namaPasien,
        noKartu: data.noKartu,
        umur: data.umur,
        alamat: data.alamat,
        penyakitId: diagnosis.topResult?.penyakitId ?? null,
        hasilDiagnosa: diagnosis.resultText,
        keterangan: diagnosis.note,
        userId: session.user.id,
        diagnosaGejala: {
          create: diagnosis.selectedGejala.map((item) => ({
            gejalaId: item.id,
          })),
        },
        diagnosaRanking: {
          create: diagnosis.ranked.map((item, index) => ({
            penyakitId: item.penyakitId,
            kodePenyakit: item.kode,
            namaPenyakit: item.nama,
            prior: item.prior,
            posterior: item.posterior,
            score: item.score,
            peringkat: index + 1,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      redirectWithMessage(diagnosaPath, "error", getDiagnosisActionErrorMessage(error.code));
    }

    redirectWithMessage(diagnosaPath, "error", "Gagal memproses diagnosa pasien.");
  }

  revalidatePath(diagnosaPath);
  revalidatePath(riwayatPath);
  revalidatePath("/dashboard");

  redirect(`${diagnosaPath}?success=${encodeURIComponent("Diagnosa berhasil diproses dan disimpan.")}&diagnosaId=${savedDiagnosa.id}`);
}
