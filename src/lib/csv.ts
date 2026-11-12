/** Minimal CSV builder used by every export in the admin area. */
export type CsvColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(column.value(row))).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function csvResponse<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
) {
  return new Response(toCsv(rows, columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
