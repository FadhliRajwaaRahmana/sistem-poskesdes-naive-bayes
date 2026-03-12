export type GejalaLookupItem = {
  id: string;
  kode: string;
  nama: string;
};

export function parseDiagnosisDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((item) => Number.parseInt(item, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function resolveSelectedGejala(submittedIds: string[], availableGejala: GejalaLookupItem[]) {
  const availableIds = new Set(availableGejala.map((item) => item.id));
  const selectedIds: string[] = [];
  const missingIds: string[] = [];
  const seenSelected = new Set<string>();
  const seenMissing = new Set<string>();

  for (const id of submittedIds) {
    if (!id) {
      continue;
    }

    if (availableIds.has(id)) {
      if (!seenSelected.has(id)) {
        selectedIds.push(id);
        seenSelected.add(id);
      }

      continue;
    }

    if (!seenMissing.has(id)) {
      missingIds.push(id);
      seenMissing.add(id);
    }
  }

  return {
    selectedIds,
    missingIds,
  };
}
