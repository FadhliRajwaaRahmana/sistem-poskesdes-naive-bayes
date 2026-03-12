export type TrainingSeedItem = {
  penyakitKode: string;
  gejalaKodes: string[];
};

export function resolveTrainingSeedIds(
  trainingSeed: TrainingSeedItem[],
  penyakitMap: Map<string, string>,
  gejalaMap: Map<string, string>,
) {
  return trainingSeed.map((item) => {
    const penyakitId = penyakitMap.get(item.penyakitKode);

    if (!penyakitId) {
      throw new Error(`Penyakit tidak ditemukan: ${item.penyakitKode}`);
    }

    const gejalaIds = Array.from(
      new Set(
        item.gejalaKodes.map((kodeGejala) => {
          const gejalaId = gejalaMap.get(kodeGejala);

          if (!gejalaId) {
            throw new Error(`Gejala tidak ditemukan: ${kodeGejala}`);
          }

          return gejalaId;
        }),
      ),
    );

    return {
      penyakitId,
      gejalaIds,
    };
  });
}
