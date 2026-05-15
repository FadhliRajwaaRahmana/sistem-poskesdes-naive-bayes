type EntityAction = "create" | "update" | "delete";

type EntityActionErrorParams = {
  code: string;
  entityName: string;
  action: EntityAction;
};

export function getEntityActionErrorMessage({ code, entityName, action }: EntityActionErrorParams) {
  if (code === "P2002") {
    return `${entityName} dengan kode yang sama sudah ada.`;
  }

  if (code === "P2003") {
    if (action === "delete") {
      return `${entityName} tidak bisa dihapus karena masih dipakai pada data lain.`;
    }

    return `Relasi data untuk ${entityName.toLowerCase()} tidak valid.`;
  }

  if (code === "P2025") {
    return `${entityName} tidak ditemukan.`;
  }

  return `Gagal memproses ${entityName.toLowerCase()}.`;
}

export function getDiagnosisActionErrorMessage(code: string) {
  if (code === "P2003") {
    return "Gejala yang dipilih sudah berubah. Silakan pilih ulang gejala lalu proses diagnosis lagi.";
  }

  return "Gagal memproses diagnosis balita.";
}
