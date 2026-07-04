import ExcelJS from "exceljs";
import type { Response } from "express";

export interface PriceListRow {
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  unitPrice: number;
  category?: string;
}

/** Parses a price list workbook. Expects header row: sku, name, description, unit, unitPrice, category. */
export async function parsePriceListWorkbook(buffer: Buffer | Uint8Array): Promise<PriceListRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const columnIndex: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    columnIndex[String(cell.value).trim().toLowerCase()] = colNumber;
  });

  const rows: PriceListRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (key: string) => {
      const idx = columnIndex[key];
      return idx ? row.getCell(idx).value : undefined;
    };
    const sku = get("sku");
    const name = get("name");
    const unitPrice = get("unitprice");
    if (!sku || !name || unitPrice === undefined || unitPrice === null) return;

    rows.push({
      sku: String(sku).trim(),
      name: String(name).trim(),
      description: get("description") ? String(get("description")) : undefined,
      unit: get("unit") ? String(get("unit")) : undefined,
      unitPrice: Number(unitPrice),
      category: get("category") ? String(get("category")) : undefined,
    });
  });

  return rows;
}

export async function writeQuoteItemsWorkbook(
  res: Response,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    status: string;
    part?: { sku: string } | null;
    issue?: { description: string } | null;
  }>
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quote Items");
  sheet.columns = [
    { header: "SKU", key: "sku", width: 16 },
    { header: "Description", key: "description", width: 40 },
    { header: "Related Issue", key: "issue", width: 40 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Unit Price", key: "unitPrice", width: 14 },
    { header: "Total", key: "total", width: 14 },
    { header: "Status", key: "status", width: 16 },
  ];

  for (const item of items) {
    sheet.addRow({
      sku: item.part?.sku ?? "",
      description: item.description,
      issue: item.issue?.description ?? "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: Number(item.quantity) * Number(item.unitPrice),
      status: item.status,
    });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="quote-ready-items.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}
