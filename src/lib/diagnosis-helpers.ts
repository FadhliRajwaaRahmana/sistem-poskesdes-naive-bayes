// Severity ranking: lower = more severe
const SEVERITY_ORDER: Record<string, number> = {
  "Marasmik-Kwashiorkor": 1,
  Marasmus: 2,
  Kwashiorkor: 3,
  Stunting: 4,
  "Gizi Kurang": 5,
  "Gizi Baik": 6,
};

export type PemantauanStatus =
  | "Kondisi Awal"
  | "Tetap"
  | "Menurun"
  | "Meningkat"
  | "Membaik (Pindah Kategori)"
  | "Memburuk (Pindah Kategori)";

export function computePemantauanStatus(
  currentDiagnosis: string,
  currentPercentage: number,
  previousDiagnosis: string | null,
  previousPercentage: number | null,
): PemantauanStatus {
  if (previousDiagnosis === null || previousPercentage === null) {
    return "Kondisi Awal";
  }

  if (currentDiagnosis !== previousDiagnosis) {
    const currentSeverity = SEVERITY_ORDER[currentDiagnosis] ?? 99;
    const previousSeverity = SEVERITY_ORDER[previousDiagnosis] ?? 99;
    if (currentSeverity === previousSeverity) return "Tetap";
    return currentSeverity > previousSeverity
      ? "Membaik (Pindah Kategori)"
      : "Memburuk (Pindah Kategori)";
  }

  const diff = currentPercentage - previousPercentage;
  if (Math.abs(diff) < 2) return "Tetap";
  return diff < 0 ? "Menurun" : "Meningkat";
}

export function getSeverityLevel(diagnosisResult: string): number {
  return SEVERITY_ORDER[diagnosisResult] ?? 99;
}
