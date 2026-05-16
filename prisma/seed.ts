import { PrismaClient, JenisKelamin } from "@prisma/client";

const prisma = new PrismaClient();

const penyakitSeed = [
  {
    kode: "C1",
    nama: "Marasmus",
    deskripsi:
      "Kekurangan asupan energi dan kalori kronis, anak tampak sangat kurus, wajah keriput, dan kulit tampak tua.",
    saranPenanganan:
      "Segera rujuk ke Rumah Sakit, pantau gula darah, berikan asupan kalori Formula F75, pemberian suplemen A dan Zink sesuai pengawasan medis.",
  },
  {
    kode: "C2",
    nama: "Kwashiorkor",
    deskripsi:
      "Kekurangan asupan protein, tubuh membengkak (edema), rambut kemerahan/jagung, dan perut buncit.",
    saranPenanganan:
      "Intervensi protein intensif, berikan makanan tinggi protein hewani dan obati infeksi penyerta. Pemberian suplemen A dan Zink sesuai pengawasan medis.",
  },
  {
    kode: "C3",
    nama: "Marasmik-Kwashiorkor",
    deskripsi:
      "Gabungan kekurangan kalori dan protein ditandai badan kurus serta pembengkakan pada kaki/tangan.",
    saranPenanganan:
      "Penanganan Darurat/Rawat Inap, stabilisasi tanda vital dan pemberian nutrisi di faskes.",
  },
  {
    kode: "C4",
    nama: "Gizi Kurang",
    deskripsi:
      "Pola makan tidak teratur, berat badan di bawah standar usia (garis kuning KMS), anak tampak lemas.",
    saranPenanganan:
      "Pemberian makanan tambahan dan edukasi gizi seimbang bagi orang tua, vitamin dan pemantauan berat badan rutin di Posyandu.",
  },
  {
    kode: "C5",
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
  { kode: "G05", nama: "Perut tampak buncit atau cekung" },
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

// likelihood[gejalaKode][penyakitKode] — dari tabel pakar
const likelihoodTable: Record<string, Record<string, number>> = {
  G01: { C1: 0.9, C2: 0.5, C3: 0.8, C4: 0.1, C5: 0.2 },
  G02: { C1: 1.0, C2: 0.1, C3: 0.9, C4: 0.0, C5: 0.0 },
  G03: { C1: 1.0, C2: 0.2, C3: 0.9, C4: 0.4, C5: 0.0 },
  G04: { C1: 0.0, C2: 1.0, C3: 1.0, C4: 0.0, C5: 0.0 },
  G05: { C1: 0.8, C2: 0.9, C3: 0.9, C4: 0.2, C5: 0.0 },
  G06: { C1: 0.6, C2: 0.9, C3: 0.9, C4: 0.3, C5: 0.1 },
  G07: { C1: 0.3, C2: 1.0, C3: 0.9, C4: 0.1, C5: 0.1 },
  G08: { C1: 1.0, C2: 0.1, C3: 0.9, C4: 0.2, C5: 0.0 },
  G09: { C1: 0.0, C2: 0.8, C3: 0.7, C4: 0.0, C5: 0.0 },
  G10: { C1: 0.9, C2: 0.8, C3: 1.0, C4: 0.2, C5: 0.1 },
  G11: { C1: 0.9, C2: 0.7, C3: 0.9, C4: 0.5, C5: 0.2 },
  G12: { C1: 0.9, C2: 0.6, C3: 0.9, C4: 0.6, C5: 0.2 },
  G13: { C1: 0.7, C2: 0.5, C3: 0.7, C4: 0.4, C5: 1.0 },
  G14: { C1: 0.8, C2: 0.8, C3: 0.9, C4: 0.4, C5: 0.3 },
  G15: { C1: 1.0, C2: 0.5, C3: 0.9, C4: 0.3, C5: 0.0 },
  G16: { C1: 1.0, C2: 0.6, C3: 1.0, C4: 0.3, C5: 0.1 },
  G17: { C1: 0.9, C2: 0.7, C3: 0.9, C4: 0.2, C5: 0.1 },
  G18: { C1: 0.0, C2: 0.9, C3: 0.8, C4: 0.0, C5: 0.0 },
  G19: { C1: 0.7, C2: 0.7, C3: 0.7, C4: 0.5, C5: 0.6 },
  G20: { C1: 0.6, C2: 0.6, C3: 0.6, C4: 0.5, C5: 0.8 },
};

// Standar pertumbuhan WHO (min-max normal per umur & jenis kelamin)
const standarPertumbuhanSeed: {
  umurBulan: number;
  jenisKelamin: JenisKelamin;
  bbMin: number;
  bbMax: number;
  tbMin: number;
  tbMax: number;
}[] = [
  // Laki-laki
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
  // Perempuan
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
  await prisma.$transaction(async (tx) => {
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

    // 4. Upsert likelihood values
    for (const [gejalaKode, penyakitValues] of Object.entries(likelihoodTable)) {
      const gejalaId = gejalaMap.get(gejalaKode);
      if (!gejalaId) throw new Error(`Gejala tidak ditemukan: ${gejalaKode}`);

      for (const [penyakitKode, likelihood] of Object.entries(penyakitValues)) {
        const penyakitId = penyakitMap.get(penyakitKode);
        if (!penyakitId) throw new Error(`Penyakit tidak ditemukan: ${penyakitKode}`);

        await tx.penyakitGejala.upsert({
          where: { penyakitId_gejalaId: { penyakitId, gejalaId } },
          update: { likelihood },
          create: { penyakitId, gejalaId, likelihood },
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
  });

  console.log("Seed berhasil: 5 penyakit, 20 gejala, 100 likelihood, 20 standar WHO.");
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
