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
const trainingPath = "/dashboard/data-training";

const gejalaSchema = z.object({
  kode: z.string().trim().min(1, "Kode gejala wajib diisi.").max(10, "Kode gejala maksimal 10 karakter."),
  nama: z.string().trim().min(1, "Nama gejala wajib diisi.").max(100, "Nama gejala maksimal 100 karakter."),
});

const penyakitSchema = z.object({
  kode: z.string().trim().min(1, "Kode penyakit wajib diisi.").max(10, "Kode penyakit maksimal 10 karakter."),
  nama: z.string().trim().min(1, "Nama penyakit wajib diisi.").max(100, "Nama penyakit maksimal 100 karakter."),
  deskripsi: z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").optional(),
});

const idSchema = z.object({
  id: z.string().trim().min(1, "ID data tidak valid."),
});

const trainingSchema = z.object({
  penyakitId: z.string().trim().min(1, "Penyakit wajib dipilih."),
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

  revalidateMasterData([gejalaPath, trainingPath, "/dashboard/diagnosa"]);
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

  revalidateMasterData([gejalaPath, trainingPath, "/dashboard/diagnosa"]);
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

  revalidateMasterData([gejalaPath, trainingPath, "/dashboard/diagnosa"]);
  redirectWithMessage(gejalaPath, "success", "Data gejala berhasil dihapus.");
}

export async function createPenyakit(formData: FormData) {
  await requireAdminSession();

  const parsed = penyakitSchema.safeParse({
    kode: getStringValue(formData.get("kode")).toUpperCase(),
    nama: getStringValue(formData.get("nama")),
    deskripsi: getOptionalString(formData.get("deskripsi")),
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

  revalidateMasterData([penyakitPath, trainingPath, "/dashboard/diagnosa"]);
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

  revalidateMasterData([penyakitPath, trainingPath, "/dashboard/diagnosa"]);
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

  revalidateMasterData([penyakitPath, trainingPath, "/dashboard/diagnosa"]);
  redirectWithMessage(penyakitPath, "success", "Data penyakit berhasil dihapus.");
}

export async function createTraining(formData: FormData) {
  await requireAdminSession();

  const parsed = trainingSchema.safeParse({
    penyakitId: getStringValue(formData.get("penyakitId")),
    gejalaIds: Array.from(new Set(formData.getAll("gejalaIds").map((value) => getStringValue(value)).filter(Boolean))),
  });

  if (!parsed.success) {
    redirectWithMessage(trainingPath, "error", parsed.error.issues[0]?.message ?? "Data training tidak valid.");
  }

  const data = parsed.data;

  try {
    await prisma.dataTraining.create({
      data: {
        penyakitId: data.penyakitId,
        trainingGejala: {
          create: data.gejalaIds.map((gejalaId) => ({ gejalaId })),
        },
      },
    });
  } catch (error) {
    redirectWithMessage(trainingPath, "error", getActionErrorMessage(error, "Data training", "create"));
  }

  revalidateMasterData([trainingPath, "/dashboard/diagnosa", "/dashboard/perhitungan"]);
  redirectWithMessage(trainingPath, "success", "Data training berhasil ditambahkan.");
}

export async function deleteTraining(formData: FormData) {
  await requireAdminSession();

  const parsed = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  if (!parsed.success) {
    redirectWithMessage(trainingPath, "error", parsed.error.issues[0]?.message ?? "ID data training tidak valid.");
  }

  const id = parsed.data.id;

  try {
    await prisma.dataTraining.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithMessage(trainingPath, "error", getActionErrorMessage(error, "Data training", "delete"));
  }

  revalidateMasterData([trainingPath, "/dashboard/diagnosa", "/dashboard/perhitungan"]);
  redirectWithMessage(trainingPath, "success", "Data training berhasil dihapus.");
}
