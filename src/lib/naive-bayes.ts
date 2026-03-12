import { prisma } from "@/lib/prisma";
import { calculateSmoothedLikelihood, getTotalGejalaOccurrences } from "@/lib/naive-bayes-math";

type GejalaOption = {
  id: string;
  kode: string;
  nama: string;
};

export type RankedDiagnosis = {
  penyakitId: string;
  kode: string;
  nama: string;
  prior: number;
  posterior: number;
  score: number;
};

export type DiagnosisResult = {
  status: "known" | "unknown";
  selectedGejala: GejalaOption[];
  resultText: string;
  note: string;
  ranked: RankedDiagnosis[];
  topResult: RankedDiagnosis | null;
};

export type DiagnosisStep = {
  gejalaId: string;
  kode: string;
  nama: string;
  matchedCount: number;
  numerator: number;
  denominator: number;
  likelihood: number;
};

export type DiagnosisBreakdown = {
  penyakitId: string;
  kode: string;
  nama: string;
  trainingCount: number;
  totalGejalaOccurrences: number;
  prior: number;
  priorNumerator: number;
  priorDenominator: number;
  steps: DiagnosisStep[];
  score: number;
  posterior: number;
};

export type DiagnosisComputation = DiagnosisResult & {
  totalScore: number;
  breakdown: DiagnosisBreakdown[];
};

export type PriorRow = {
  penyakitId: string;
  kode: string;
  nama: string;
  trainingCount: number;
  totalTraining: number;
  prior: number;
};

export type LikelihoodCell = {
  penyakitId: string;
  kode: string;
  nama: string;
  trainingCount: number;
  totalGejalaOccurrences: number;
  matchedCount: number;
  numerator: number | null;
  denominator: number | null;
  likelihood: number | null;
};

export type LikelihoodRow = {
  gejalaId: string;
  kode: string;
  nama: string;
  cells: LikelihoodCell[];
};

export type TrainingSample = {
  id: string;
  createdAt: Date;
  penyakitId: string;
  penyakitKode: string;
  penyakitNama: string;
  gejala: GejalaOption[];
};

export type NaiveBayesOverview = {
  totalTraining: number;
  totalGejala: number;
  gejalaMaster: GejalaOption[];
  penyakitMaster: Array<{
    id: string;
    kode: string;
    nama: string;
    trainingCount: number;
  }>;
  trainingSamples: TrainingSample[];
  priorRows: PriorRow[];
  likelihoodRows: LikelihoodRow[];
};

export type NaiveBayesPageData = {
  overview: NaiveBayesOverview;
  simulation: DiagnosisComputation | null;
};

function roundScore(value: number) {
  return Number(value.toFixed(6));
}

function getMatchedCount(
  dataTraining: Array<{
    trainingGejala: Array<{
      gejalaId: string;
    }>;
  }>,
  gejalaId: string,
) {
  return dataTraining.filter((training) => training.trainingGejala.some((item) => item.gejalaId === gejalaId)).length;
}

async function loadNaiveBayesContext() {
  const [gejalaMaster, penyakitList] = await Promise.all([
    prisma.gejala.findMany({
      orderBy: { kode: "asc" },
    }),
    prisma.penyakit.findMany({
      include: {
        dataTraining: {
          include: {
            trainingGejala: {
              include: {
                gejala: true,
              },
            },
          },
        },
      },
      orderBy: { kode: "asc" },
    }),
  ]);

  const totalTraining = penyakitList.reduce((sum, penyakit) => sum + penyakit.dataTraining.length, 0);

  return {
    gejalaMaster,
    penyakitList,
    totalGejala: gejalaMaster.length,
    totalTraining,
  };
}

function buildUnknownResult(
  selectedGejala: GejalaOption[],
  note: string,
  ranked: RankedDiagnosis[] = [],
  breakdown: DiagnosisBreakdown[] = [],
  totalScore = 0,
): DiagnosisComputation {
  return {
    status: "unknown",
    selectedGejala,
    resultText: "Diagnosa penyakit tidak diketahui",
    note,
    ranked,
    topResult: null,
    breakdown,
    totalScore: roundScore(totalScore),
  };
}

function buildDiagnosisComputation(
  context: Awaited<ReturnType<typeof loadNaiveBayesContext>>,
  gejalaIds: string[],
): DiagnosisComputation {
  const selectedIds = Array.from(new Set(gejalaIds.filter(Boolean)));
  const selectedIdSet = new Set(selectedIds);
  const selectedGejala = context.gejalaMaster.filter((item) => selectedIdSet.has(item.id));

  if (selectedGejala.length === 0) {
    return buildUnknownResult([], "Gejala belum dipilih, perlu pemeriksaan lebih lanjut oleh tenaga medis.");
  }

  if (context.totalTraining === 0 || context.totalGejala === 0) {
    return buildUnknownResult(
      selectedGejala,
      "Data training belum tersedia, perlu pemeriksaan lebih lanjut oleh tenaga medis.",
    );
  }

  const breakdownWithRaw = context.penyakitList
    .filter((penyakit) => penyakit.dataTraining.length > 0)
    .map((penyakit) => {
      const trainingCount = penyakit.dataTraining.length;
      const totalGejalaOccurrences = getTotalGejalaOccurrences(penyakit.dataTraining);
      const priorRaw = trainingCount / context.totalTraining;

      const stepsWithRaw = selectedGejala.map((gejala) => {
        const matchedCount = getMatchedCount(penyakit.dataTraining, gejala.id);
        const denominator = totalGejalaOccurrences + context.totalGejala;
        const likelihoodRaw = calculateSmoothedLikelihood({
          matchedCount,
          totalGejalaOccurrences,
          totalGejala: context.totalGejala,
        });

        return {
          gejalaId: gejala.id,
          kode: gejala.kode,
          nama: gejala.nama,
          matchedCount,
          numerator: matchedCount + 1,
          denominator,
          likelihood: roundScore(likelihoodRaw),
          rawLikelihood: likelihoodRaw,
        };
      });

      const rawScore = stepsWithRaw.reduce((score, step) => score * step.rawLikelihood, priorRaw);

      return {
        penyakitId: penyakit.id,
        kode: penyakit.kode,
        nama: penyakit.nama,
        trainingCount,
        totalGejalaOccurrences,
        prior: roundScore(priorRaw),
        priorNumerator: trainingCount,
        priorDenominator: context.totalTraining,
        steps: stepsWithRaw.map((step) => ({
          gejalaId: step.gejalaId,
          kode: step.kode,
          nama: step.nama,
          matchedCount: step.matchedCount,
          numerator: step.numerator,
          denominator: step.denominator,
          likelihood: step.likelihood,
        })),
        rawScore,
      };
    })
    .sort((left, right) => right.rawScore - left.rawScore);

  const totalScoreRaw = breakdownWithRaw.reduce((sum, item) => sum + item.rawScore, 0);

  const breakdown = breakdownWithRaw.map((item) => ({
    ...item,
    score: roundScore(item.rawScore),
    posterior: totalScoreRaw > 0 ? roundScore(item.rawScore / totalScoreRaw) : 0,
  }));

  const ranked = breakdown.map((item) => ({
    penyakitId: item.penyakitId,
    kode: item.kode,
    nama: item.nama,
    prior: item.prior,
    posterior: item.posterior,
    score: item.score,
  }));

  const topResult = ranked[0] ?? null;

  if (!topResult || topResult.posterior <= 0) {
    return buildUnknownResult(
      selectedGejala,
      "Gejala belum tersedia dalam dataset, perlu pemeriksaan lebih lanjut oleh tenaga medis.",
      ranked,
      breakdown,
      totalScoreRaw,
    );
  }

  return {
    status: "known",
    selectedGejala,
    resultText: topResult.nama,
    note: `Hasil diagnosa tertinggi mengarah ke ${topResult.nama} dengan probabilitas ${(topResult.posterior * 100).toFixed(2)}%.`,
    ranked,
    topResult,
    breakdown,
    totalScore: roundScore(totalScoreRaw),
  };
}

function buildOverview(context: Awaited<ReturnType<typeof loadNaiveBayesContext>>): NaiveBayesOverview {
  const trainingSamples = context.penyakitList
    .flatMap((penyakit) =>
      penyakit.dataTraining.map((training) => ({
        id: training.id,
        createdAt: training.createdAt,
        penyakitId: penyakit.id,
        penyakitKode: penyakit.kode,
        penyakitNama: penyakit.nama,
        gejala: training.trainingGejala
          .map((item) => ({
            id: item.gejala.id,
            kode: item.gejala.kode,
            nama: item.gejala.nama,
          }))
          .sort((left, right) => left.kode.localeCompare(right.kode)),
      })),
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  const priorRows = context.penyakitList.map((penyakit) => ({
    penyakitId: penyakit.id,
    kode: penyakit.kode,
    nama: penyakit.nama,
    trainingCount: penyakit.dataTraining.length,
    totalTraining: context.totalTraining,
    prior: context.totalTraining > 0 ? roundScore(penyakit.dataTraining.length / context.totalTraining) : 0,
  }));

  const likelihoodRows = context.gejalaMaster.map((gejala) => ({
    gejalaId: gejala.id,
    kode: gejala.kode,
    nama: gejala.nama,
    cells: context.penyakitList.map((penyakit) => {
      const trainingCount = penyakit.dataTraining.length;
      const totalGejalaOccurrences = getTotalGejalaOccurrences(penyakit.dataTraining);

      if (trainingCount === 0 || context.totalGejala === 0) {
        return {
          penyakitId: penyakit.id,
          kode: penyakit.kode,
          nama: penyakit.nama,
          trainingCount,
          totalGejalaOccurrences,
          matchedCount: 0,
          numerator: null,
          denominator: null,
          likelihood: null,
        } satisfies LikelihoodCell;
      }

      const matchedCount = getMatchedCount(penyakit.dataTraining, gejala.id);
      const numerator = matchedCount + 1;
      const denominator = totalGejalaOccurrences + context.totalGejala;

      return {
        penyakitId: penyakit.id,
        kode: penyakit.kode,
        nama: penyakit.nama,
        trainingCount,
        totalGejalaOccurrences,
        matchedCount,
        numerator,
        denominator,
        likelihood: roundScore(
          calculateSmoothedLikelihood({
            matchedCount,
            totalGejalaOccurrences,
            totalGejala: context.totalGejala,
          }),
        ),
      } satisfies LikelihoodCell;
    }),
  }));

  return {
    totalTraining: context.totalTraining,
    totalGejala: context.totalGejala,
    gejalaMaster: context.gejalaMaster.map((item) => ({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
    })),
    penyakitMaster: context.penyakitList.map((item) => ({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      trainingCount: item.dataTraining.length,
    })),
    trainingSamples,
    priorRows,
    likelihoodRows,
  };
}

export async function getDiagnosisComputation(gejalaIds: string[]): Promise<DiagnosisComputation> {
  const context = await loadNaiveBayesContext();
  return buildDiagnosisComputation(context, gejalaIds);
}

export async function calculateDiagnosis(gejalaIds: string[]): Promise<DiagnosisResult> {
  const result = await getDiagnosisComputation(gejalaIds);

  return {
    status: result.status,
    selectedGejala: result.selectedGejala,
    resultText: result.resultText,
    note: result.note,
    ranked: result.ranked,
    topResult: result.topResult,
  };
}

export async function getNaiveBayesPageData(gejalaIds: string[]): Promise<NaiveBayesPageData> {
  const context = await loadNaiveBayesContext();

  return {
    overview: buildOverview(context),
    simulation: gejalaIds.length > 0 ? buildDiagnosisComputation(context, gejalaIds) : null,
  };
}
