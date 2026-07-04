import { prisma } from "../db";
import { writeQuoteItemsWorkbook } from "../services/excel";
import { asyncHandler } from "./asyncHandler";
import { crudRouter } from "./crudFactory";

export const quoteItemsRouter = crudRouter(prisma.quoteItem, {
  include: { issue: true, part: true },
});

quoteItemsRouter.get("/export/xlsx", asyncHandler(async (_req, res) => {
  const items = await prisma.quoteItem.findMany({
    where: { status: "QUOTE_READY" },
    include: { issue: true, part: true },
    orderBy: { createdAt: "desc" },
  });

  await writeQuoteItemsWorkbook(
    res,
    items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      status: item.status,
      part: item.part,
      issue: item.issue,
    }))
  );
}));
