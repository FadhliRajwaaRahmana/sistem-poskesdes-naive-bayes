import { PrismaClient } from "@prisma/client";
import { resolveTrainingSeedIds, type TrainingSeedItem } from "./seed-utils";

const prisma = new PrismaClient();

const gejalaSeed = [
  { kode: "G01", nama: "Pilek" },
  { kode: "G02", nama: "Pusing" },
  { kode: "G03", nama: "Demam" },
  { kode: "G04", nama: "Batuk" },
  { kode: "G05", nama: "Mual" },
  { kode: "G06", nama: "Muntah" },
  { kode: "G07", nama: "Pegal" },
];

const penyakitSeed = [
  { kode: "P01", nama: "Influenza", deskripsi: "Infeksi saluran pernapasan atas dengan gejala pilek dan pusing." },
  { kode: "P02", nama: "ISPA", deskripsi: "Infeksi saluran pernapasan akut dengan gejala demam, batuk, atau pilek." },
  { kode: "P03", nama: "Gastritis", deskripsi: "Peradangan lambung dengan gejala mual, muntah, atau pusing." },
  { kode: "P04", nama: "Hipertensi", deskripsi: "Tekanan darah tinggi yang sering disertai pusing dan pegal." },
  { kode: "P05", nama: "Rematik", deskripsi: "Keluhan persendian atau otot yang dominan ditandai pegal." },
];

const trainingSeed: TrainingSeedItem[] = [
  { penyakitKode: "P01", gejalaKodes: ["G01", "G02"] },
  { penyakitKode: "P02", gejalaKodes: ["G03", "G04"] },
  { penyakitKode: "P02", gejalaKodes: ["G03", "G01"] },
  { penyakitKode: "P03", gejalaKodes: ["G05", "G06"] },
  { penyakitKode: "P04", gejalaKodes: ["G02", "G07"] },
  { penyakitKode: "P04", gejalaKodes: ["G02", "G07"] },
  { penyakitKode: "P01", gejalaKodes: ["G01", "G02"] },
  { penyakitKode: "P03", gejalaKodes: ["G05", "G02"] },
  { penyakitKode: "P03", gejalaKodes: ["G05", "G02"] },
  { penyakitKode: "P03", gejalaKodes: ["G05", "G06"] },
  { penyakitKode: "P05", gejalaKodes: ["G07"] },
  { penyakitKode: "P05", gejalaKodes: ["G07"] },
  { penyakitKode: "P05", gejalaKodes: ["G07"] },
  { penyakitKode: "P04", gejalaKodes: ["G02", "G07"] },
  { penyakitKode: "P04", gejalaKodes: ["G02", "G07"] },
  { penyakitKode: "P04", gejalaKodes: ["G02", "G07"] },
  { penyakitKode: "P05", gejalaKodes: ["G07"] },
  { penyakitKode: "P05", gejalaKodes: ["G07"] },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const item of gejalaSeed) {
      await tx.gejala.upsert({
        where: { kode: item.kode },
        update: { nama: item.nama },
        create: item,
      });
    }

    for (const item of penyakitSeed) {
      await tx.penyakit.upsert({
        where: { kode: item.kode },
        update: { nama: item.nama, deskripsi: item.deskripsi },
        create: item,
      });
    }

    await tx.trainingGejala.deleteMany();
    await tx.dataTraining.deleteMany();

    const gejalaList = await tx.gejala.findMany();
    const gejalaMap = new Map<string, string>(gejalaList.map((item) => [item.kode, item.id]));

    const penyakitList = await tx.penyakit.findMany();
    const penyakitMap = new Map<string, string>(penyakitList.map((item) => [item.kode, item.id]));

    const resolvedTrainingSeed = resolveTrainingSeedIds(trainingSeed, penyakitMap, gejalaMap);

    for (const item of resolvedTrainingSeed) {
      await tx.dataTraining.create({
        data: {
          penyakitId: item.penyakitId,
          trainingGejala: {
            create: item.gejalaIds.map((gejalaId) => ({ gejalaId })),
          },
        },
      });
    }
  });
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
