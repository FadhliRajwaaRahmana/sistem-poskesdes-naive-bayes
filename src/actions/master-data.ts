"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEntityActionErrorMessage } from "@/lib/prisma-action-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

const gejalaPath = "/dashboard/gejala";
const penyakitPath = "/dashboard/penyakit";
const diagnosisPath = "/dashboard/diagnosis";
const perhitunganPath = "/dashboard/perhitungan";

const gejalaSchema = z.object({
  kode: z.string().trim().min(1, "Kode gejala wajib diisi.").max(10, "Kode gejala maksimal 10 karakter."),
  nama: z.string().trim().min(1, "Nama gejala wajib diisi.").max(100, "Nama gejala maksimal 100 karakter."),
});

const penyakitSchema = z.object({
  kode: z.string().trim().min(1, "Kode penyakit wajib diisi.").max(10, "Kode penyakit maksimal 10 karakter."),
  nama: z.string().trim().min(1, "Nama penyakit wajib diisi.").max(100, "Nama penyakit maksimal 100 karakter."),
  deskripsi: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter.").optional(),
  saranPenanganan: z.string().trim().max(2000, "Saran penanganan maksimal 2000 karakter.").optional(),
});

const idSchema = z.object({
  id: z.string().trim().min(1, "ID data tidak valid."),
});

const likelihoodSchema = z.object({
  penyakitId: z.string().trim().min(1, "ID penyakit tidak valid."),
  gejalaId: z.string().trim().min(1, "ID gejala tidak valid."),
  likelihood: z.coerce.number().min(0, "Likelihood minimal 0.").max(1, "Likelihood maksimal 1."),
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

function revalidateMasterData(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

function getActionErrorMessage(error: unknown, entityName: string, action: "create" | "update" | "delete") {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return getEntityActionErrorMessage({
      code: error.code,
      entityName,
      action,
    });
  }

  return `Gagal memproses ${entityName.toLowerCase()}.`;
}

export async function createGejala(formData: FormData) {
  await requireAdminSession();

  const parsed = gejalaSchema.safeParse({
    kode: getStringValue(formData.get("kode")).toUpperCase(),
    nama: getStringValue(formData.get("nama")),
  });

  if (!parsed.success) {
    redirectWithMessage(gejalaPath, "error", parsed.error.issues[0]?.message ?? "Data gejala tidak valid.");
  }

  const data = parsed.data;

  try {
    await prisma.gejala.create({
      data,
    });
  } catch (error) {
    redirectWithMessage(gejalaPath, "error", getActionErrorMessage(error, "Gejala", "create"));
  }

  revalidateMasterData([gejalaPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(gejalaPath, "success", "Data gejala berhasil ditambahkan.");
}

export async function updateGejala(formData: FormData) {
  await requireAdminSession();

  const parsedId = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  const parsedData = gejalaSchema.safeParse({
    kode: getStringValue(formData.get("kode")).toUpperCase(),
    nama: getStringValue(formData.get("nama")),
  });

  if (!parsedId.success || !parsedData.success) {
    const message = !parsedData.success
      ? parsedData.error.issues[0]?.message
      : !parsedId.success
        ? parsedId.error.issues[0]?.message
        : "Data gejala tidak valid.";

    redirectWithMessage(gejalaPath, "error", message ?? "Data gejala tidak valid.");
  }

  const id = parsedId.data.id;
  const data = parsedData.data;

  try {
    await prisma.gejala.update({
      where: { id },
      data,
    });
  } catch (error) {
    redirectWithMessage(gejalaPath, "error", getActionErrorMessage(error, "Gejala", "update"));
  }

  revalidateMasterData([gejalaPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(gejalaPath, "success", "Data gejala berhasil diperbarui.");
}

export async function deleteGejala(formData: FormData) {
  await requireAdminSession();

  const parsed = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  if (!parsed.success) {
    redirectWithMessage(gejalaPath, "error", parsed.error.issues[0]?.message ?? "ID gejala tidak valid.");
  }

  const id = parsed.data.id;

  try {
    await prisma.gejala.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithMessage(gejalaPath, "error", getActionErrorMessage(error, "Gejala", "delete"));
  }

  revalidateMasterData([gejalaPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(gejalaPath, "success", "Data gejala berhasil dihapus.");
}

export async function createPenyakit(formData: FormData) {
  await requireAdminSession();

  const parsed = penyakitSchema.safeParse({
    kode: getStringValue(formData.get("kode")).toUpperCase(),
    nama: getStringValue(formData.get("nama")),
    deskripsi: getOptionalString(formData.get("deskripsi")),
    saranPenanganan: getOptionalString(formData.get("saranPenanganan")),
  });

  if (!parsed.success) {
    redirectWithMessage(penyakitPath, "error", parsed.error.issues[0]?.message ?? "Data penyakit tidak valid.");
  }

  const data = parsed.data;

  try {
    await prisma.penyakit.create({
      data,
    });
  } catch (error) {
    redirectWithMessage(penyakitPath, "error", getActionErrorMessage(error, "Penyakit", "create"));
  }

  revalidateMasterData([penyakitPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(penyakitPath, "success", "Data penyakit berhasil ditambahkan.");
}

export async function updatePenyakit(formData: FormData) {
  await requireAdminSession();

  const parsedId = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  const parsedData = penyakitSchema.safeParse({
    kode: getStringValue(formData.get("kode")).toUpperCase(),
    nama: getStringValue(formData.get("nama")),
    deskripsi: getOptionalString(formData.get("deskripsi")),
    saranPenanganan: getOptionalString(formData.get("saranPenanganan")),
  });

  if (!parsedId.success || !parsedData.success) {
    const message = !parsedData.success
      ? parsedData.error.issues[0]?.message
      : !parsedId.success
        ? parsedId.error.issues[0]?.message
        : "Data penyakit tidak valid.";

    redirectWithMessage(penyakitPath, "error", message ?? "Data penyakit tidak valid.");
  }

  const id = parsedId.data.id;
  const data = parsedData.data;

  try {
    await prisma.penyakit.update({
      where: { id },
      data,
    });
  } catch (error) {
    redirectWithMessage(penyakitPath, "error", getActionErrorMessage(error, "Penyakit", "update"));
  }

  revalidateMasterData([penyakitPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(penyakitPath, "success", "Data penyakit berhasil diperbarui.");
}

export async function deletePenyakit(formData: FormData) {
  await requireAdminSession();

  const parsed = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  if (!parsed.success) {
    redirectWithMessage(penyakitPath, "error", parsed.error.issues[0]?.message ?? "ID penyakit tidak valid.");
  }

  const id = parsed.data.id;

  try {
    await prisma.penyakit.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithMessage(penyakitPath, "error", getActionErrorMessage(error, "Penyakit", "delete"));
  }

  revalidateMasterData([penyakitPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(penyakitPath, "success", "Data penyakit berhasil dihapus.");
}

export async function updateLikelihood(formData: FormData) {
  await requireAdminSession();

  const parsed = likelihoodSchema.safeParse({
    penyakitId: getStringValue(formData.get("penyakitId")),
    gejalaId: getStringValue(formData.get("gejalaId")),
    likelihood: getStringValue(formData.get("likelihood")),
  });

  if (!parsed.success) {
    redirectWithMessage(penyakitPath, "error", parsed.error.issues[0]?.message ?? "Data likelihood tidak valid.");
  }

  const { penyakitId, gejalaId, likelihood } = parsed.data;

  try {
    await prisma.penyakitGejala.upsert({
      where: {
        penyakitId_gejalaId: { penyakitId, gejalaId },
      },
      update: { likelihood },
      create: { penyakitId, gejalaId, likelihood },
    });
  } catch (error) {
    redirectWithMessage(`${penyakitPath}?detail=${penyakitId}`, "error", getActionErrorMessage(error, "Likelihood", "update"));
  }

  revalidateMasterData([penyakitPath, gejalaPath, diagnosisPath, perhitunganPath]);
  redirectWithMessage(`${penyakitPath}?detail=${penyakitId}`, "success", "Nilai likelihood berhasil diperbarui.");
}
