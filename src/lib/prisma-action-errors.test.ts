import { describe, it, expect } from "vitest";
import { getEntityActionErrorMessage, getDiagnosisActionErrorMessage } from "./prisma-action-errors";

describe("prisma-action-errors", () => {
  it("getEntityActionErrorMessage memberi pesan relasi untuk delete", () => {
    expect(
      getEntityActionErrorMessage({
        code: "P2003",
        entityName: "Penyakit",
        action: "delete",
      }),
    ).toBe("Penyakit tidak bisa dihapus karena masih dipakai pada data lain.");
  });

  it("getEntityActionErrorMessage tidak memakai pesan hapus untuk update", () => {
    expect(
      getEntityActionErrorMessage({
        code: "P2003",
        entityName: "Penyakit",
        action: "update",
      }),
    ).toBe("Relasi data untuk penyakit tidak valid.");
  });

  it("getDiagnosisActionErrorMessage memberi pesan input relasi yang jelas", () => {
    expect(getDiagnosisActionErrorMessage("P2003")).toBe(
      "Gejala yang dipilih sudah berubah. Silakan pilih ulang gejala lalu proses diagnosis lagi.",
    );
  });
});
