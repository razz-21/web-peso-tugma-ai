/**
 * Generic spreadsheet-import helpers shared by the applicant and job importers:
 * reading CSV/Excel into a grid of string cells, splitting multi-value cells,
 * and resolving columns by tolerant header matching.
 */

/**
 * Parse CSV text into rows of fields. Handles RFC 4180 quoting: double-quoted
 * fields, escaped quotes (`""`), and commas/newlines inside quotes.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Flush the trailing field/row (files often omit a final newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Read an uploaded import file into a grid of string cells. Excel workbooks
 * (.xlsx/.xls) are parsed with SheetJS (first sheet); .csv falls back to the
 * lightweight parser. Dates are emitted as text so they display as entered.
 */
export async function readImportRows(file: File): Promise<string[][]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  if (isCsv) {
    return parseCsv(await file.text());
  }

  // Load SheetJS on demand so it only ships when an import actually runs.
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const sheet = workbook.Sheets[firstSheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });
  return grid.map((row) => row.map((cell) => (cell == null ? '' : String(cell))));
}

/** Split a multi-value cell into trimmed parts (comma/semicolon/pipe separated). */
export function splitList(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Normalize a header cell for tolerant matching (collapse spaces, lower-case). */
export function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Build a per-row cell accessor from a header row and a field→aliases map, so a
 * spreadsheet whose column order/spelling varies still maps correctly. Returns
 * `at(cells, field)` which trims the resolved cell (empty string when absent).
 */
export function headerAccessor(
  header: string[],
  aliases: Record<string, readonly string[]>,
): (cells: string[], field: string) => string {
  const normalized = header.map(normalizeHeader);
  const indexOf = (field: string): number => {
    for (const alias of aliases[field] ?? [field]) {
      const i = normalized.indexOf(alias);
      if (i >= 0) {
        return i;
      }
    }
    return -1;
  };
  return (cells, field) => {
    const i = indexOf(field);
    return i >= 0 ? (cells[i] ?? '').trim() : '';
  };
}
