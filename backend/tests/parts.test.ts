import ExcelJS from "exceljs";
import { beforeAll, describe, expect, it } from "vitest";
import { adminAgent } from "./helpers";

async function buildPriceListBuffer() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Prices");
  sheet.addRow(["sku", "name", "description", "unit", "unitPrice", "category"]);
  sheet.addRow(["TEST-001", "Test Widget", "A widget", "ea", 9.99, "Widgets"]);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe("parts import and quote item export", () => {
  let agent: Awaited<ReturnType<typeof adminAgent>>;

  beforeAll(async () => {
    agent = await adminAgent();
  });

  it("imports a price list workbook and upserts parts", async () => {
    const buffer = await buildPriceListBuffer();
    const res = await agent.post("/api/parts/import").attach("file", buffer, "pricelist.xlsx");
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);

    const list = await agent.get("/api/parts");
    expect(list.body.some((p: { sku: string }) => p.sku === "TEST-001")).toBe(true);
  });

  it("exports quote-ready items as an xlsx file", async () => {
    const part = (await agent.get("/api/parts")).body.find((p: { sku: string }) => p.sku === "TEST-001");

    await agent.post("/api/quote-items").send({
      partId: part.id,
      description: "Replace widget",
      quantity: 2,
      unitPrice: part.unitPrice,
      status: "QUOTE_READY",
    });

    const res = await agent.get("/api/quote-items/export/xlsx");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml");
  });
});
