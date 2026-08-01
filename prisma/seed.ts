import { PrismaClient, JenisKelamin } from "@prisma/client";

const prisma = new PrismaClient();

const penyakitSeed = [
  {
    kode: "P01",
    nama: "Marasmus",
    deskripsi:
      "Kekurangan asupan energi dan kalori kronis, anak tampak sangat kurus, wajah keriput, dan kulit tampak tua.",
    saranPenanganan:
      "Pantau gula darah, berikan asupan kalori Formula F75, pemberian suplemen A dan Zink sesuai pengawasan medis.",
  },
  {
    kode: "P02",
    nama: "Kwashiorkor",
    deskripsi:
      "Kekurangan asupan protein, tubuh membengkak (edema), rambut kemerahan/jagung, dan perut buncit.",
    saranPenanganan:
      "Intervensi protein intensif, berikan makanan tinggi protein hewani dan obati infeksi penyerta. Pemberian suplemen A dan Zink sesuai pengawasan medis.",
  },
  {
    kode: "P03",
    nama: "Marasmik-Kwashiorkor",
    deskripsi:
      "Gabungan kekurangan kalori dan protein ditandai badan kurus serta pembengkakan pada kaki/tangan.",
    saranPenanganan:
      "Pemeriksaan lebih lanjut di fasilitas pelayanan kesehatan untuk mendapatkan penanganan sesuai kondisi klinis, seperti stabilisasi kondisi umum, terapi nutrisi bertahap, dan pemantauan komplikasi oleh tenaga kesehatan.",
  },
  {
    kode: "P04",
    nama: "Gizi Kurang",
    deskripsi:
      "Pola makan tidak teratur, berat badan di bawah standar usia (garis kuning KMS), anak tampak lemas.",
    saranPenanganan:
      "Pemberian makanan tambahan dan edukasi gizi seimbang bagi orang tua, vitamin dan pemantauan berat badan.",
  },
  {
    kode: "P05",
    nama: "Stunting",
    deskripsi:
      "Kekurangan gizi kronis dan infeksi berulang pada 1000 HPK, tinggi badan anak di bawah standar usianya.",
    saranPenanganan:
      "Pastikan asupan protein hewani harian, perbaiki kebersihan air dan sanitasi lingkungan, serta edukasi pola asuh. Pemberian suplemen Zink untuk membantu pertumbuhan tulang anak.",
  },
];

const gejalaSeed = [
  { kode: "G01", nama: "Berat badan sangat kurang (Bawah Garis Merah)" },
  { kode: "G02", nama: "Wajah tampak seperti orang tua" },
  { kode: "G03", nama: "Tampak sangat kurus (tulang membungkus kulit)" },
  { kode: "G04", nama: "Edema (bengkak) pada kedua punggung kaki" },
  { kode: "G05", nama: "Perut tampak buncit" },
  { kode: "G06", nama: "Rambut kusam, tipis, dan mudah dicabut" },
  { kode: "G07", nama: "Perubahan warna rambut (kemerahan seperti jagung)" },
  { kode: "G08", nama: "Kulit tampak keriput (Baggy Pants pada bokong)" },
  { kode: "G09", nama: "Bercak merah kehitaman pada kulit (Crazy Pavement)" },
  { kode: "G10", nama: "Anak tampak apatis (pendiam/tidak aktif)" },
  { kode: "G11", nama: "Anak sering rewel dan cengeng" },
  { kode: "G12", nama: "Nafsu makan sangat menurun" },
  { kode: "G13", nama: "Tinggi badan tidak sesuai usia (pendek)" },
  { kode: "G14", nama: "Sering mengalami infeksi (diare/batuk pilek)" },
  { kode: "G15", nama: "Otot mengalami pengecilan (atropi)" },
  { kode: "G16", nama: "Lingkar Lengan Atas (LiLA) < 11,5 cm" },
  { kode: "G17", nama: "Pandangan mata sayu" },
  { kode: "G18", nama: "Pembesaran hati (Hepatomegali)" },
  { kode: "G19", nama: "Riwayat ASI eksklusif tidak tuntas" },
  { kode: "G20", nama: "Riwayat berat badan lahir rendah (BBLR)" },
];

// Rule table biner: 1 = gejala terdapat pada penyakit, 0 = tidak
// ruleTable[gejalaKode][penyakitKode]
// Rule table sesuai PDF "Tabel 3 Rule Naïve Bayes"
const ruleTable: Record<string, Record<string, number>> = {
  G01: { P01: 1, P02: 1, P03: 1, P04: 1, P05: 0 },
  G02: { P01: 1, P02: 0, P03: 1, P04: 0, P05: 0 },
  G03: { P01: 1, P02: 0, P03: 1, P04: 0, P05: 0 },
  G04: { P01: 0, P02: 1, P03: 1, P04: 0, P05: 0 },
  G05: { P01: 0, P02: 1, P03: 0, P04: 0, P05: 0 },
  G06: { P01: 0, P02: 1, P03: 1, P04: 0, P05: 0 },
  G07: { P01: 0, P02: 1, P03: 1, P04: 0, P05: 0 },
  G08: { P01: 1, P02: 0, P03: 0, P04: 0, P05: 0 },
  G09: { P01: 0, P02: 1, P03: 0, P04: 0, P05: 0 },
  G10: { P01: 0, P02: 1, P03: 1, P04: 0, P05: 0 },
  G11: { P01: 0, P02: 0, P03: 0, P04: 1, P05: 0 },
  G12: { P01: 0, P02: 0, P03: 0, P04: 1, P05: 0 },
  G13: { P01: 0, P02: 0, P03: 0, P04: 0, P05: 1 },
  G14: { P01: 1, P02: 1, P03: 1, P04: 1, P05: 1 },
  G15: { P01: 1, P02: 0, P03: 1, P04: 0, P05: 0 },
  G16: { P01: 1, P02: 0, P03: 1, P04: 1, P05: 0 },
  G17: { P01: 1, P02: 0, P03: 0, P04: 0, P05: 0 },
  G18: { P01: 0, P02: 1, P03: 0, P04: 0, P05: 0 },
  G19: { P01: 0, P02: 0, P03: 0, P04: 1, P05: 1 },
  G20: { P01: 0, P02: 0, P03: 0, P04: 1, P05: 1 },
};

const standarPertumbuhanSeed: {
  umurBulan: number;
  jenisKelamin: JenisKelamin;
  bbMin: number;
  bbMax: number;
  tbMin: number;
  tbMax: number;
}[] = [
  { umurBulan: 0, jenisKelamin: "LAKI_LAKI", bbMin: 2.5, bbMax: 3.9, tbMin: 48.0, tbMax: 51.8 },
  { umurBulan: 3, jenisKelamin: "LAKI_LAKI", bbMin: 5.7, bbMax: 7.2, tbMin: 59.9, tbMax: 63.9 },
  { umurBulan: 6, jenisKelamin: "LAKI_LAKI", bbMin: 7.1, bbMax: 8.8, tbMin: 65.9, tbMax: 70.3 },
  { umurBulan: 9, jenisKelamin: "LAKI_LAKI", bbMin: 8.0, bbMax: 9.9, tbMin: 70.3, tbMax: 75.0 },
  { umurBulan: 12, jenisKelamin: "LAKI_LAKI", bbMin: 8.6, bbMax: 10.8, tbMin: 73.9, tbMax: 78.9 },
  { umurBulan: 18, jenisKelamin: "LAKI_LAKI", bbMin: 9.8, bbMax: 12.2, tbMin: 80.2, tbMax: 85.8 },
  { umurBulan: 24, jenisKelamin: "LAKI_LAKI", bbMin: 10.8, bbMax: 13.6, tbMin: 84.4, tbMax: 90.4 },
  { umurBulan: 36, jenisKelamin: "LAKI_LAKI", bbMin: 12.7, bbMax: 16.2, tbMin: 92.4, tbMax: 99.1 },
  { umurBulan: 48, jenisKelamin: "LAKI_LAKI", bbMin: 14.3, bbMax: 18.5, tbMin: 99.1, tbMax: 106.7 },
  { umurBulan: 60, jenisKelamin: "LAKI_LAKI", bbMin: 16.0, bbMax: 21.0, tbMin: 105.3, tbMax: 113.9 },
  { umurBulan: 0, jenisKelamin: "PEREMPUAN", bbMin: 2.4, bbMax: 3.7, tbMin: 47.3, tbMax: 51.0 },
  { umurBulan: 3, jenisKelamin: "PEREMPUAN", bbMin: 5.2, bbMax: 6.6, tbMin: 58.2, tbMax: 62.1 },
  { umurBulan: 6, jenisKelamin: "PEREMPUAN", bbMin: 6.5, bbMax: 8.2, tbMin: 64.1, tbMax: 68.5 },
  { umurBulan: 9, jenisKelamin: "PEREMPUAN", bbMin: 7.3, bbMax: 9.3, tbMin: 68.4, tbMax: 73.2 },
  { umurBulan: 12, jenisKelamin: "PEREMPUAN", bbMin: 7.9, bbMax: 10.1, tbMin: 72.0, tbMax: 77.1 },
  { umurBulan: 18, jenisKelamin: "PEREMPUAN", bbMin: 9.1, bbMax: 11.5, tbMin: 78.5, tbMax: 84.3 },
  { umurBulan: 24, jenisKelamin: "PEREMPUAN", bbMin: 10.2, bbMax: 13.0, tbMin: 83.2, tbMax: 89.4 },
  { umurBulan: 36, jenisKelamin: "PEREMPUAN", bbMin: 12.2, bbMax: 15.8, tbMin: 91.2, tbMax: 98.1 },
  { umurBulan: 48, jenisKelamin: "PEREMPUAN", bbMin: 14.0, bbMax: 18.5, tbMin: 98.4, tbMax: 106.2 },
  { umurBulan: 60, jenisKelamin: "PEREMPUAN", bbMin: 15.8, bbMax: 21.2, tbMin: 104.7, tbMax: 113.5 },
];

async function main() {
  await prisma.$transaction(
    async (tx) => {
      // 1. Upsert gejala
      for (const item of gejalaSeed) {
        await tx.gejala.upsert({
          where: { kode: item.kode },
          update: { nama: item.nama },
          create: item,
        });
      }

      // 2. Upsert penyakit
      for (const item of penyakitSeed) {
        await tx.penyakit.upsert({
          where: { kode: item.kode },
          update: {
            nama: item.nama,
            deskripsi: item.deskripsi,
            saranPenanganan: item.saranPenanganan,
          },
          create: item,
        });
      }

      // 3. Rebuild ID maps
      const gejalaList = await tx.gejala.findMany();
      const gejalaMap = new Map(gejalaList.map((g) => [g.kode, g.id]));

      const penyakitList = await tx.penyakit.findMany();
      const penyakitMap = new Map(penyakitList.map((p) => [p.kode, p.id]));

      // 4. Upsert rule values (binary 1/0)
      for (const [gejalaKode, penyakitValues] of Object.entries(ruleTable)) {
        const gejalaId = gejalaMap.get(gejalaKode);
        if (!gejalaId) throw new Error(`Gejala tidak ditemukan: ${gejalaKode}`);

        for (const [penyakitKode, ruleValue] of Object.entries(penyakitValues)) {
          const penyakitId = penyakitMap.get(penyakitKode);
          if (!penyakitId) throw new Error(`Penyakit tidak ditemukan: ${penyakitKode}`);

          await tx.penyakitGejala.upsert({
            where: { penyakitId_gejalaId: { penyakitId, gejalaId } },
            update: { likelihood: ruleValue },
            create: { penyakitId, gejalaId, likelihood: ruleValue },
          });
        }
      }

      // 5. Upsert standar pertumbuhan WHO
      for (const item of standarPertumbuhanSeed) {
        await tx.standarPertumbuhan.upsert({
          where: {
            umurBulan_jenisKelamin: {
              umurBulan: item.umurBulan,
              jenisKelamin: item.jenisKelamin,
            },
          },
          update: {
            bbMin: item.bbMin,
            bbMax: item.bbMax,
            tbMin: item.tbMin,
            tbMax: item.tbMax,
          },
          create: item,
        });
      }
    },
    { maxWait: 10000, timeout: 60000 },
  );

  console.log("Seed berhasil: 5 penyakit, 20 gejala, 100 rule, 20 standar WHO.");
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
