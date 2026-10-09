/**
 * Tabular export builders (CSV and Excel) used by the /api/export route handlers.
 *
 * - CSV: UTF-8 with BOM (so Excel detects the encoding), CRLF line endings, RFC 4180 quoting,
 *   and spreadsheet formula-injection protection: text cells that begin with = + - @ (or a
 *   tab / carriage return) are prefixed with a single quote so they are shown as text.
 * - Excel: SpreadsheetML 2003 (XML) workbook served as `.xls`. Every text cell is written with
 *   ss:Type="String", which Excel never evaluates as a formula; numbers use ss:Type="Number".
 *   No third-party dependency is required.
 */

export type CellValue = string | number | boolean | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => CellValue;
}

export type ExportFormat = 'csv' | 'xls';

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

// Characters that are not allowed in XML 1.0 documents.
// eslint-disable-next-line no-control-regex
const XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function xmlEscape(value: string): string {
  return value
    .replace(XML_INVALID, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\r\n|\r|\n/g, '&#10;');
}

function xmlCell(value: CellValue, style?: string): string {
  const styleAttr = style ? ` ss:StyleID="${style}"` : '';
  if (value === null || value === undefined || value === '') return `<Cell${styleAttr}/>`;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell${styleAttr}><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return `<Cell${styleAttr}><Data ss:Type="String">${xmlEscape(text)}</Data></Cell>`;
}

function sheetName(name: string): string {
  const cleaned = name.replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return cleaned || 'Sheet1';
}

export function toSpreadsheetXml<T>(rows: T[], columns: ExportColumn<T>[], title: string): string {
  const header = `<Row>${columns.map((c) => xmlCell(c.header, 'h')).join('')}</Row>`;
  const body = rows.map((row) => `<Row>${columns.map((c) => xmlCell(c.value(row))).join('')}</Row>`).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top" ss:WrapText="0"/></Style><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>',
    `<Worksheet ss:Name="${xmlEscape(sheetName(title))}">`,
    `<Table>`,
    header,
    body,
    '</Table>',
    '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>',
    '</Worksheet>',
    '</Workbook>',
  ].join('\n');
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
  const body =
    options.format === 'csv' ? toCsv(rows, columns) : toSpreadsheetXml(rows, columns, options.sheetTitle);
  const contentType =
    options.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8';
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
