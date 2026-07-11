export type GejalaLookupItem = {
  id: string;
  kode: string;
  nama: string;
};

export function parseDiagnosisDate(value: string, localTime?: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((item) => Number.parseInt(item, 10));

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (localTime && /^\d{2}:\d{2}:\d{2}$/.test(localTime)) {
    const [h, m, s] = localTime.split(":").map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59) {
      hours = h;
      minutes = m;
      seconds = s;
    }
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
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
