import assert from "node:assert/strict";
import test from "node:test";

test("getTotalGejalaOccurrences menghitung seluruh kemunculan gejala pada data training", async () => {
  const loadedModule = await import("./naive-bayes-math").catch(() => null);

  assert.ok(loadedModule, "Module naive-bayes-math.ts harus tersedia.");

  const total = loadedModule.getTotalGejalaOccurrences([
    {
      trainingGejala: [{ gejalaId: "g1" }, { gejalaId: "g2" }],
    },
    {
      trainingGejala: [{ gejalaId: "g2" }],
    },
  ]);

  assert.equal(total, 3);
});

test("calculateSmoothedLikelihood memakai total kemunculan gejala kelas sebagai denominator", async () => {
  const loadedModule = await import("./naive-bayes-math").catch(() => null);

  assert.ok(loadedModule, "Module naive-bayes-math.ts harus tersedia.");
  assert.equal(
    loadedModule.calculateSmoothedLikelihood({
      matchedCount: 2,
      totalGejalaOccurrences: 3,
      totalGejala: 7,
    }),
    0.3,
  );
});
