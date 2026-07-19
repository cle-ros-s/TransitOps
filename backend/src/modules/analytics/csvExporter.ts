export function buildCsvFromData<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const header = headers.map((h) => `"${h}"`).join(',');
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}
