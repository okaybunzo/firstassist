import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const inspectionFormsRouter = crudRouter(prisma.inspectionForm, {
  include: { fields: { orderBy: { order: "asc" } } },
});
