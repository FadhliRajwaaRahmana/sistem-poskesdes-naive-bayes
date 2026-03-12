import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME;
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !username || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diisi.");
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        name,
        username,
        role: "ADMIN",
        emailVerified: true,
      },
    });

    console.log(`Admin sudah ada dan disinkronkan: ${email}`);
    return;
  }

  await auth.api.signUpEmail({
    body: {
      name,
      username,
      email,
      password,
    },
  });

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log(`Admin berhasil dibuat: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
