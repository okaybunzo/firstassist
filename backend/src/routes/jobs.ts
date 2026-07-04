import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const jobsRouter = crudRouter(prisma.job, {
  include: {
    site: { include: { client: true } },
    asset: true,
    assignedTo: true,
    issues: true,
    attachments: true,
    checklistResults: true,
    reports: true,
  },
});
