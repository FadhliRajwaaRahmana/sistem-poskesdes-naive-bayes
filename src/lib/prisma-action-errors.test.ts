import assert from "node:assert/strict";
import test from "node:test";

test("getEntityActionErrorMessage memberi pesan relasi untuk delete", async () => {
  const loadedModule = await import("./prisma-action-errors").catch(() => null);

  assert.ok(loadedModule, "Module prisma-action-errors.ts harus tersedia.");
  assert.equal(
    loadedModule.getEntityActionErrorMessage({
      code: "P2003",
      entityName: "Penyakit",
      action: "delete",
    }),
    "Penyakit tidak bisa dihapus karena masih dipakai pada data lain.",
  );
});

test("getEntityActionErrorMessage tidak memakai pesan hapus untuk update", async () => {
  const loadedModule = await import("./prisma-action-errors").catch(() => null);

  assert.ok(loadedModule, "Module prisma-action-errors.ts harus tersedia.");
  assert.equal(
    loadedModule.getEntityActionErrorMessage({
      code: "P2003",
      entityName: "Penyakit",
      action: "update",
    }),
    "Relasi data untuk penyakit tidak valid.",
  );
});

test("getDiagnosisActionErrorMessage memberi pesan input relasi yang jelas", async () => {
  const loadedModule = await import("./prisma-action-errors").catch(() => null);

  assert.ok(loadedModule, "Module prisma-action-errors.ts harus tersedia.");
  assert.equal(
    loadedModule.getDiagnosisActionErrorMessage("P2003"),
    "Gejala yang dipilih sudah berubah. Silakan pilih ulang gejala lalu proses diagnosis lagi.",
  );
});
