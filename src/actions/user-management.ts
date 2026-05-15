"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

const penggunaPath = "/dashboard/pengguna";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore."),
  password: z.string().min(6, "Password minimal 6 karakter.").max(50),
});

const updateUserSchema = z.object({
  id: z.string().trim().min(1, "ID tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
});

const resetPasswordSchema = z.object({
  id: z.string().trim().min(1, "ID tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter.").max(50),
});

const idSchema = z.object({
  id: z.string().trim().min(1, "ID tidak valid."),
});

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

async function hashPassword(password: string): Promise<string> {
  const ctx = await (auth as any).$context;
  return ctx.password.hash(password);
}

export async function createUser(formData: FormData) {
  await requireAdminSession();

  const parsed = createUserSchema.safeParse({
    name: getStringValue(formData.get("name")),
    username: getStringValue(formData.get("username")),
    password: getStringValue(formData.get("password")),
  });

  if (!parsed.success) {
    redirectWithMessage(penggunaPath, "error", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const { name, username, password } = parsed.data;
  const email = `${username.toLowerCase()}@sistem.local`;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true },
  });

  if (existing) {
    redirectWithMessage(penggunaPath, "error", "Username sudah digunakan.");
  }

  let hashedPassword: string;
  try {
    hashedPassword = await hashPassword(password);
  } catch {
    redirectWithMessage(penggunaPath, "error", "Gagal memproses password.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          username,
          displayUsername: username,
          role: "USER",
          emailVerified: true,
        },
      });

      await tx.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithMessage(penggunaPath, "error", "Username sudah digunakan.");
    }
    redirectWithMessage(penggunaPath, "error", "Gagal membuat akun pengguna.");
  }

  revalidatePath(penggunaPath);
  redirectWithMessage(penggunaPath, "success", "Akun pengguna berhasil dibuat.");
}

export async function updateUser(formData: FormData) {
  await requireAdminSession();

  const parsed = updateUserSchema.safeParse({
    id: getStringValue(formData.get("id")),
    name: getStringValue(formData.get("name")),
  });

  if (!parsed.success) {
    redirectWithMessage(penggunaPath, "error", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const { id, name } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) {
    redirectWithMessage(penggunaPath, "error", "Pengguna tidak ditemukan.");
  }
  if (user.role === "ADMIN") {
    redirectWithMessage(penggunaPath, "error", "Tidak dapat mengubah akun admin dari sini.");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { name },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      redirectWithMessage(penggunaPath, "error", "Pengguna tidak ditemukan.");
    }
    redirectWithMessage(penggunaPath, "error", "Gagal memperbarui pengguna.");
  }

  revalidatePath(penggunaPath);
  redirectWithMessage(penggunaPath, "success", "Data pengguna berhasil diperbarui.");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdminSession();

  const parsed = resetPasswordSchema.safeParse({
    id: getStringValue(formData.get("id")),
    password: getStringValue(formData.get("password")),
  });

  if (!parsed.success) {
    redirectWithMessage(penggunaPath, "error", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const { id, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) {
    redirectWithMessage(penggunaPath, "error", "Pengguna tidak ditemukan.");
  }
  if (user.role === "ADMIN") {
    redirectWithMessage(penggunaPath, "error", "Tidak dapat mereset password admin dari sini.");
  }

  let hashedPassword: string;
  try {
    hashedPassword = await hashPassword(password);
  } catch {
    redirectWithMessage(penggunaPath, "error", "Gagal memproses password.");
  }

  try {
    const result = await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashedPassword },
    });

    if (result.count === 0) {
      redirectWithMessage(penggunaPath, "error", "Akun credential tidak ditemukan.");
    }
  } catch {
    redirectWithMessage(penggunaPath, "error", "Gagal mereset password.");
  }

  revalidatePath(penggunaPath);
  redirectWithMessage(penggunaPath, "success", "Password berhasil direset.");
}

export async function deleteUser(formData: FormData) {
  await requireAdminSession();

  const parsed = idSchema.safeParse({
    id: getStringValue(formData.get("id")),
  });

  if (!parsed.success) {
    redirectWithMessage(penggunaPath, "error", "ID pengguna tidak valid.");
  }

  const { id } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) {
    redirectWithMessage(penggunaPath, "error", "Pengguna tidak ditemukan.");
  }
  if (user.role === "ADMIN") {
    redirectWithMessage(penggunaPath, "error", "Tidak dapat menghapus akun admin.");
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      redirectWithMessage(penggunaPath, "error", "Pengguna tidak ditemukan.");
    }
    redirectWithMessage(penggunaPath, "error", "Gagal menghapus pengguna.");
  }

  revalidatePath(penggunaPath);
  redirectWithMessage(penggunaPath, "success", "Pengguna berhasil dihapus.");
}
