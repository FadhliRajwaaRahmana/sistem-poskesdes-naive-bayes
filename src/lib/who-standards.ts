import type { JenisKelamin } from "@prisma/client";

type StandarEntry = {
  umurBulan: number;
  bbMin: number;
  bbMax: number;
  tbMin: number;
  tbMax: number;
};

const STANDAR_LAKI: StandarEntry[] = [
  { umurBulan: 0, bbMin: 2.5, bbMax: 3.9, tbMin: 48.0, tbMax: 51.8 },
  { umurBulan: 3, bbMin: 5.7, bbMax: 7.2, tbMin: 59.9, tbMax: 63.9 },
  { umurBulan: 6, bbMin: 7.1, bbMax: 8.8, tbMin: 65.9, tbMax: 70.3 },
  { umurBulan: 9, bbMin: 8.0, bbMax: 9.9, tbMin: 70.3, tbMax: 75.0 },
  { umurBulan: 12, bbMin: 8.6, bbMax: 10.8, tbMin: 73.9, tbMax: 78.9 },
  { umurBulan: 18, bbMin: 9.8, bbMax: 12.2, tbMin: 80.2, tbMax: 85.8 },
  { umurBulan: 24, bbMin: 10.8, bbMax: 13.6, tbMin: 84.4, tbMax: 90.4 },
  { umurBulan: 36, bbMin: 12.7, bbMax: 16.2, tbMin: 92.4, tbMax: 99.1 },
  { umurBulan: 48, bbMin: 14.3, bbMax: 18.5, tbMin: 99.1, tbMax: 106.7 },
  { umurBulan: 60, bbMin: 16.0, bbMax: 21.0, tbMin: 105.3, tbMax: 113.9 },
];

const STANDAR_PEREMPUAN: StandarEntry[] = [
  { umurBulan: 0, bbMin: 2.4, bbMax: 3.7, tbMin: 47.3, tbMax: 51.0 },
  { umurBulan: 3, bbMin: 5.2, bbMax: 6.6, tbMin: 58.2, tbMax: 62.1 },
  { umurBulan: 6, bbMin: 6.5, bbMax: 8.2, tbMin: 64.1, tbMax: 68.5 },
  { umurBulan: 9, bbMin: 7.3, bbMax: 9.3, tbMin: 68.4, tbMax: 73.2 },
  { umurBulan: 12, bbMin: 7.9, bbMax: 10.1, tbMin: 72.0, tbMax: 77.1 },
  { umurBulan: 18, bbMin: 9.1, bbMax: 11.5, tbMin: 78.5, tbMax: 84.3 },
  { umurBulan: 24, bbMin: 10.2, bbMax: 13.0, tbMin: 83.2, tbMax: 89.4 },
  { umurBulan: 36, bbMin: 12.2, bbMax: 15.8, tbMin: 91.2, tbMax: 98.1 },
  { umurBulan: 48, bbMin: 14.0, bbMax: 18.5, tbMin: 98.4, tbMax: 106.2 },
  { umurBulan: 60, bbMin: 15.8, bbMax: 21.2, tbMin: 104.7, tbMax: 113.5 },
];

const CHECKPOINT_MONTHS = [0, 3, 6, 9, 12, 18, 24, 36, 48, 60];

function findClosestCheckpoint(umurBulan: number): number {
  let closest = CHECKPOINT_MONTHS[0]!;
  for (const cp of CHECKPOINT_MONTHS) {
    if (cp <= umurBulan) closest = cp;
    else break;
  }
  return closest;
}

function getStandar(jenisKelamin: JenisKelamin): StandarEntry[] {
  return jenisKelamin === "LAKI_LAKI" ? STANDAR_LAKI : STANDAR_PEREMPUAN;
}

export type AutoSymptomResult = {
  autoGejalaKodes: string[];
  bbStatus: "normal" | "kurang";
  tbStatus: "normal" | "kurang";
  lilaStatus: "normal" | "kurang" | "peringatan" | "tidak_berlaku";
  standarUsed: StandarEntry | null;
};

export function evaluateAutoSymptoms(
  umurBulan: number,
  jenisKelamin: JenisKelamin,
  beratBadan: number,
  tinggiBadan: number,
  lila: number | null,
): AutoSymptomResult {
  const checkpoint = findClosestCheckpoint(umurBulan);
  const table = getStandar(jenisKelamin);
  const standar = table.find((s) => s.umurBulan === checkpoint) ?? null;

  const autoGejalaKodes: string[] = [];
  let bbStatus: AutoSymptomResult["bbStatus"] = "normal";
  let tbStatus: AutoSymptomResult["tbStatus"] = "normal";
  let lilaStatus: AutoSymptomResult["lilaStatus"] = "tidak_berlaku";

  if (standar) {
    if (beratBadan < standar.bbMin) {
      bbStatus = "kurang";
      autoGejalaKodes.push("G01");
    }
    if (tinggiBadan < standar.tbMin) {
      tbStatus = "kurang";
      autoGejalaKodes.push("G13");
    }
  }

  if (umurBulan >= 12 && lila !== null) {
    if (lila < 11.5) {
      lilaStatus = "kurang";
      autoGejalaKodes.push("G16");
    } else if (lila <= 12.5) {
      lilaStatus = "peringatan";
    } else {
      lilaStatus = "normal";
    }
  }

  return { autoGejalaKodes, bbStatus, tbStatus, lilaStatus, standarUsed: standar };
}

export function isGiziBaik(autoGejalaKodes: string[], manualGejalaKodes: string[]): boolean {
  return autoGejalaKodes.length === 0 && manualGejalaKodes.length === 0;
}

export function getStandarForAge(
  umurBulan: number,
  jenisKelamin: JenisKelamin,
): StandarEntry | null {
  const checkpoint = findClosestCheckpoint(umurBulan);
  return getStandar(jenisKelamin).find((s) => s.umurBulan === checkpoint) ?? null;
}

export { STANDAR_LAKI, STANDAR_PEREMPUAN, CHECKPOINT_MONTHS };
