type TrainingWithGejala = {
  trainingGejala: Array<{
    gejalaId: string;
  }>;
};

export function getTotalGejalaOccurrences(dataTraining: TrainingWithGejala[]) {
  return dataTraining.reduce((total, training) => total + training.trainingGejala.length, 0);
}

export function calculateSmoothedLikelihood({
  matchedCount,
  totalGejalaOccurrences,
  totalGejala,
}: {
  matchedCount: number;
  totalGejalaOccurrences: number;
  totalGejala: number;
}) {
  if (totalGejala <= 0) {
    return 0;
  }

  return (matchedCount + 1) / (totalGejalaOccurrences + totalGejala);
}
