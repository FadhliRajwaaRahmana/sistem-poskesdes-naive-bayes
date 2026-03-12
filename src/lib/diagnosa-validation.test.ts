import assert from "node:assert/strict";
import test from "node:test";

test("parseDiagnosisDate menolak tanggal kalender yang tidak valid", async () => {
  const loadedModule = await import("./diagnosa-validation").catch(() => null);

  assert.ok(loadedModule, "Module diagnosa-validation.ts harus tersedia.");
  assert.equal(loadedModule.parseDiagnosisDate("2026-02-30"), null);
});

test("parseDiagnosisDate mengubah input valid menjadi Date UTC", async () => {
  const loadedModule = await import("./diagnosa-validation").catch(() => null);

  assert.ok(loadedModule, "Module diagnosa-validation.ts harus tersedia.");
  assert.equal(loadedModule.parseDiagnosisDate("2026-03-11")?.toISOString(), "2026-03-11T00:00:00.000Z");
});

test("resolveSelectedGejala memisahkan id valid dan id yang sudah tidak ada", async () => {
  const loadedModule = await import("./diagnosa-validation").catch(() => null);

  assert.ok(loadedModule, "Module diagnosa-validation.ts harus tersedia.");

  const result = loadedModule.resolveSelectedGejala(
    ["g1", "ghost", "g1", "g2"],
    [
      { id: "g1", kode: "G01", nama: "Pilek" },
      { id: "g2", kode: "G02", nama: "Demam" },
    ],
  );

  assert.deepEqual(result.selectedIds, ["g1", "g2"]);
  assert.deepEqual(result.missingIds, ["ghost"]);
});
