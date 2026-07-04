import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const issuesRouter = crudRouter(prisma.issue, {
  include: { job: true, asset: true, attachments: true, quoteItems: true },
});
