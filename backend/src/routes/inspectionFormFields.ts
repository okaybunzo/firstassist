import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const inspectionFormFieldsRouter = crudRouter(prisma.inspectionFormField, {
  orderBy: { order: "asc" },
});
