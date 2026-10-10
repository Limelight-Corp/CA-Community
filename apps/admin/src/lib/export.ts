/**
 * Tabular export builders (CSV and Excel) used by the /api/export route handlers.
 *
 * - CSV: UTF-8 with BOM (so Excel detects the encoding), CRLF line endings, RFC 4180 quoting,
 *   and spreadsheet formula-injection protection: text cells that begin with = + - @ (or a
 *   tab / carriage return) are prefixed with a single quote so they are shown as text.
 * - Excel: a real .xlsx workbook (see ./xlsx.ts). Text cells are inline strings, which Excel
 *   never evaluates as formulas; numbers stay numbers. No third-party dependency is required.
 */

import { toXlsx } from './xlsx';

export type CellValue = string | number | boolean | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => CellValue;
}

export type ExportFormat = 'csv' | 'xlsx';

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvCell(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  let text = String(value);
  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

/** Builds the download Response for a dataset in the requested format. */
export function exportResponse<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  options: { format: ExportFormat; baseName: string; sheetTitle: string }
): Response {
  const stamp = new Date().toISOString().slice(0, 10);
  const safeBase = options.baseName.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'export';
  const filename = `${safeBase}-${stamp}.${options.format}`;
  const body = options.format === 'csv' ? toCsv(rows, columns) : new Blob([toXlsx(rows, columns, options.sheetTitle)]);
  const contentType =
    options.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
