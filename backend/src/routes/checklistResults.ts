import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const checklistResultsRouter = crudRouter(prisma.checklistResult, {
  include: { form: { include: { fields: true } }, answers: true },
  orderBy: { submittedAt: "desc" },
});
