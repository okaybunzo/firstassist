import fs from "node:fs";
import { prisma } from "../db";
import { upload } from "../middleware/upload";
import { parsePriceListWorkbook } from "../services/excel";
import { asyncHandler } from "./asyncHandler";
import { crudRouter } from "./crudFactory";

export const partsRouter = crudRouter(prisma.part, { orderBy: { name: "asc" } });

// Bulk import the master price list from an uploaded Excel file.
// Upserts by SKU so re-importing an updated price list is safe.
partsRouter.post("/import", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const rows = await parsePriceListWorkbook(fs.readFileSync(req.file.path));
  const results = await Promise.all(
    rows.map((row) =>
      prisma.part.upsert({
        where: { sku: row.sku },
        create: {
          sku: row.sku,
          name: row.name,
          description: row.description,
          unit: row.unit,
          unitPrice: row.unitPrice,
          category: row.category,
        },
        update: {
          name: row.name,
          description: row.description,
          unit: row.unit,
          unitPrice: row.unitPrice,
          category: row.category,
        },
      })
    )
  );

  res.json({ imported: results.length });
}));
