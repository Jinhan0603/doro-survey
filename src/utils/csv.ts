function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const normalized = value == null ? '' : String(value);
  const escaped = normalized.replaceAll('"', '""');
  return `"${escaped}"`;
}

export function downloadCsv(
  fileName: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
