import { prisma } from "@/lib/prisma";

// ────────────────────────────── Types ──────────────────────────────

export type RankedDiagnosis = {
  penyakitId: string;
  kodePenyakit: string;
  namaPenyakit: string;
  deskripsi: string;
  saranPenanganan: string;
  prior: number;
  score: number;
  posterior: number;
};

export type DiagnosisStep = {
  kodeGejala: string;
  namaGejala: string;
  likelihood: number;
};

export type DiagnosisBreakdown = {
  penyakitId: string;
  kodePenyakit: string;
  namaPenyakit: string;
  prior: number;
  steps: DiagnosisStep[];
  likelihoodProduct: number;
  score: number;
  posterior: number;
};

export type DiagnosisResult = {
  status: "gizi_baik" | "known" | "unknown";
  resultText: string;
  deskripsi: string;
  saranPenanganan: string;
  ranked: RankedDiagnosis[];
  topResult: RankedDiagnosis | null;
};

export type DiagnosisComputation = DiagnosisResult & {
  totalScore: number;
  breakdown: DiagnosisBreakdown[];
};

export type LikelihoodCell = {
  kodeGejala: string;
  namaGejala: string;
  value: number;
};

export type LikelihoodRow = {
  kodePenyakit: string;
  namaPenyakit: string;
  cells: LikelihoodCell[];
};

export type PriorRow = {
  kodePenyakit: string;
  namaPenyakit: string;
  prior: number;
};

export type NaiveBayesOverview = {
  totalPenyakit: number;
  totalGejala: number;
  gejalaList: { id: string; kode: string; nama: string }[];
  priorTable: PriorRow[];
  likelihoodMatrix: LikelihoodRow[];
};

export type NaiveBayesPageData = {
  overview: NaiveBayesOverview;
  simulation: DiagnosisComputation | null;
};

// ────────────────────────────── Helpers ──────────────────────────────

function roundScore(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

type NaiveBayesContext = {
  penyakitList: {
    id: string;
    kode: string;
    nama: string;
    deskripsi: string | null;
    saranPenanganan: string | null;
    penyakitGejala: { gejalaId: string; likelihood: number }[];
  }[];
  gejalaList: { id: string; kode: string; nama: string }[];
  totalPenyakit: number;
};

async function loadNaiveBayesContext(): Promise<NaiveBayesContext> {
  const [penyakitList, gejalaList] = await Promise.all([
    prisma.penyakit.findMany({
      orderBy: { kode: "asc" },
      include: {
        penyakitGejala: {
          select: { gejalaId: true, likelihood: true },
        },
      },
    }),
    prisma.gejala.findMany({ orderBy: { kode: "asc" } }),
  ]);

  return {
    penyakitList,
    gejalaList,
    totalPenyakit: penyakitList.length,
  };
}

// ────────────────────────────── Core ──────────────────────────────

function buildDiagnosisComputation(
  ctx: NaiveBayesContext,
  selectedGejalaIds: string[],
): DiagnosisComputation {
  if (selectedGejalaIds.length === 0 || ctx.totalPenyakit === 0) {
    return {
      status: "unknown",
      resultText: "Tidak dapat menentukan diagnosis.",
      deskripsi: "",
      saranPenanganan: "",
      ranked: [],
      topResult: null,
      totalScore: 0,
      breakdown: [],
    };
  }

  const gejalaMap = new Map(ctx.gejalaList.map((g) => [g.id, g]));
  const prior = roundScore(1 / ctx.totalPenyakit);

  const breakdown: DiagnosisBreakdown[] = ctx.penyakitList.map((penyakit) => {
    const likelihoodMap = new Map(
      penyakit.penyakitGejala.map((pg) => [pg.gejalaId, pg.likelihood]),
    );

    const steps: DiagnosisStep[] = selectedGejalaIds.map((gejalaId) => {
      const gejala = gejalaMap.get(gejalaId);
      const likelihood = likelihoodMap.get(gejalaId) ?? 0;
      return {
        kodeGejala: gejala?.kode ?? "?",
        namaGejala: gejala?.nama ?? "Tidak diketahui",
        likelihood: roundScore(likelihood),
      };
    });

    const likelihoodProduct = roundScore(
      steps.reduce((acc, step) => acc * step.likelihood, 1),
    );
    const score = roundScore(prior * likelihoodProduct);

    return {
      penyakitId: penyakit.id,
      kodePenyakit: penyakit.kode,
      namaPenyakit: penyakit.nama,
      prior,
      steps,
      likelihoodProduct,
      score,
      posterior: 0,
    };
  });

  const totalScore = roundScore(breakdown.reduce((sum, b) => sum + b.score, 0));

  for (const b of breakdown) {
    b.posterior = totalScore > 0 ? roundScore((b.score / totalScore) * 100) : 0;
  }

  breakdown.sort((a, b) => b.score - a.score);

  const ranked: RankedDiagnosis[] = breakdown.map((b) => {
    const penyakit = ctx.penyakitList.find((p) => p.id === b.penyakitId)!;
    return {
      penyakitId: b.penyakitId,
      kodePenyakit: b.kodePenyakit,
      namaPenyakit: b.namaPenyakit,
      deskripsi: penyakit.deskripsi ?? "",
      saranPenanganan: penyakit.saranPenanganan ?? "",
      prior: b.prior,
      score: b.score,
      posterior: b.posterior,
    };
  });

  const topResult = ranked[0] ?? null;
  const hasResult = topResult !== null && topResult.posterior > 0;

  return {
    status: hasResult ? "known" : "unknown",
    resultText: hasResult ? topResult.namaPenyakit : "Tidak dapat menentukan diagnosis.",
    deskripsi: hasResult ? topResult.deskripsi : "",
    saranPenanganan: hasResult ? topResult.saranPenanganan : "",
    ranked,
    topResult,
    totalScore,
    breakdown,
  };
}

function buildOverview(ctx: NaiveBayesContext): NaiveBayesOverview {
  const prior = ctx.totalPenyakit > 0 ? roundScore(1 / ctx.totalPenyakit) : 0;

  const priorTable: PriorRow[] = ctx.penyakitList.map((p) => ({
    kodePenyakit: p.kode,
    namaPenyakit: p.nama,
    prior,
  }));

  const likelihoodMatrix: LikelihoodRow[] = ctx.penyakitList.map((penyakit) => {
    const likelihoodMap = new Map(
      penyakit.penyakitGejala.map((pg) => [pg.gejalaId, pg.likelihood]),
    );

    const cells: LikelihoodCell[] = ctx.gejalaList.map((gejala) => ({
      kodeGejala: gejala.kode,
      namaGejala: gejala.nama,
      value: likelihoodMap.get(gejala.id) ?? 0,
    }));

    return {
      kodePenyakit: penyakit.kode,
      namaPenyakit: penyakit.nama,
      cells,
    };
  });

  return {
    totalPenyakit: ctx.totalPenyakit,
    totalGejala: ctx.gejalaList.length,
    gejalaList: ctx.gejalaList.map((g) => ({ id: g.id, kode: g.kode, nama: g.nama })),
    priorTable,
    likelihoodMatrix,
  };
}

// ────────────────────────────── Public API ──────────────────────────────

export async function getDiagnosisComputation(
  gejalaIds: string[],
): Promise<DiagnosisComputation> {
  const ctx = await loadNaiveBayesContext();
  return buildDiagnosisComputation(ctx, gejalaIds);
}

export async function calculateDiagnosis(
  gejalaIds: string[],
): Promise<DiagnosisResult> {
  const computation = await getDiagnosisComputation(gejalaIds);
  const { totalScore: _, breakdown: __, ...result } = computation;
  return result;
}

export async function getNaiveBayesPageData(
  gejalaIds: string[],
): Promise<NaiveBayesPageData> {
  const ctx = await loadNaiveBayesContext();
  const overview = buildOverview(ctx);
  const simulation =
    gejalaIds.length > 0 ? buildDiagnosisComputation(ctx, gejalaIds) : null;

  return { overview, simulation };
}
