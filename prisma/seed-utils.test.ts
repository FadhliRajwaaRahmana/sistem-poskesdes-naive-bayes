import assert from "node:assert/strict";
import test from "node:test";

test("resolveTrainingSeedIds memetakan kode penyakit dan gejala ke id database", async () => {
  const loadedModule = await import("./seed-utils").catch(() => null);

  assert.ok(loadedModule, "Module seed-utils.ts harus tersedia.");

  const result = loadedModule.resolveTrainingSeedIds(
    [
      {
        penyakitKode: "P01",
        gejalaKodes: ["G01", "G02"],
      },
    ],
    new Map([["P01", "penyakit-1"]]),
    new Map([
      ["G01", "gejala-1"],
      ["G02", "gejala-2"],
    ]),
  );

  assert.deepEqual(result, [
    {
      penyakitId: "penyakit-1",
      gejalaIds: ["gejala-1", "gejala-2"],
    },
  ]);
});

test("resolveTrainingSeedIds melempar error jika kode penyakit tidak ditemukan", async () => {
  const loadedModule = await import("./seed-utils").catch(() => null);

  assert.ok(loadedModule, "Module seed-utils.ts harus tersedia.");

  assert.throws(
    () =>
      loadedModule.resolveTrainingSeedIds(
        [
          {
            penyakitKode: "P99",
            gejalaKodes: ["G01"],
          },
        ],
        new Map(),
        new Map([["G01", "gejala-1"]]),
      ),
    /Penyakit tidak ditemukan: P99/,
  );
});
