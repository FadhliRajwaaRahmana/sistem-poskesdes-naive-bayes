import { prisma } from "@/lib/prisma";

export type RankedDiagnosis = {
  penyakitId: string;
  kodePenyakit: string;
  namaPenyakit: string;
  deskripsi: string;
  saranPenanganan: string;
  prior: number;
  score: number;
  posterior: number;
  peringkat: number;
};

export type DiagnosisResult = {
  status: "gizi_baik" | "known" | "unknown";
  resultText: string;
  deskripsi: string;
  saranPenanganan: string;
  ranked: RankedDiagnosis[];
  topResult: RankedDiagnosis | null;
};

// Laplacian smoothing parameters
const M = 20; // total gejala
const P_PRIOR = 1 / 5; // 1/jumlah penyakit = 0.2

function laplacianP(nc: number): number {
  // P(Ai|Vj) = (nc + m*p) / (n + m) = (nc + 20*0.2) / (1 + 20) = (nc + 4) / 21
  return (nc + M * P_PRIOR) / (1 + M);
}

export async function calculateDiagnosis(
  selectedGejalaIds: string[],
): Promise<DiagnosisResult> {
  if (selectedGejalaIds.length === 0) {
    return {
      status: "gizi_baik",
      resultText: "Gizi Baik",
      deskripsi: "Semua pengukuran dalam batas normal, tidak ada gejala klinis.",
      saranPenanganan: "",
      ranked: [],
      topResult: null,
    };
  }

  const penyakitList = await prisma.penyakit.findMany({
    orderBy: { kode: "asc" },
    include: {
      penyakitGejala: {
        select: { gejalaId: true, likelihood: true },
      },
    },
  });

  if (penyakitList.length === 0) {
    return {
      status: "unknown",
      resultText: "Tidak dapat menentukan diagnosis.",
      deskripsi: "",
      saranPenanganan: "",
      ranked: [],
      topResult: null,
    };
  }

  const totalPenyakit = penyakitList.length;
  const prior = 1 / totalPenyakit;

  const ranked: RankedDiagnosis[] = penyakitList.map((penyakit) => {
    const ruleMap = new Map(
      penyakit.penyakitGejala.map((pg) => [pg.gejalaId, pg.likelihood]),
    );

    let score = prior;
    for (const gejalaId of selectedGejalaIds) {
      const nc = ruleMap.get(gejalaId) ?? 0;
      score *= laplacianP(nc);
    }

    return {
      penyakitId: penyakit.id,
      kodePenyakit: penyakit.kode,
      namaPenyakit: penyakit.nama,
      deskripsi: penyakit.deskripsi ?? "",
      saranPenanganan: penyakit.saranPenanganan ?? "",
      prior,
      score,
      posterior: 0,
      peringkat: 0,
    };
  });

  const totalScore = ranked.reduce((sum, r) => sum + r.score, 0);
  for (const r of ranked) {
    r.posterior = totalScore > 0 ? (r.score / totalScore) * 100 : 0;
  }

  ranked.sort((a, b) => b.score - a.score);
  ranked.forEach((r, i) => {
    r.peringkat = i + 1;
  });

  const topResult = ranked[0] ?? null;

  return {
    status: topResult ? "known" : "unknown",
    resultText: topResult?.namaPenyakit ?? "Tidak dapat menentukan diagnosis.",
    deskripsi: topResult?.deskripsi ?? "",
    saranPenanganan: topResult?.saranPenanganan ?? "",
    ranked,
    topResult,
  };
}
