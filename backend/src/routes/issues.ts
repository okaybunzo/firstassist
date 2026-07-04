import { prisma } from "../db";
import { verifyJobAssignment } from "../middleware/verifyJobAssignment";
import { crudRouter } from "./crudFactory";

export const issuesRouter = crudRouter(prisma.issue, {
  include: { job: true, asset: true, attachments: true, quoteItems: true },
  scopeWhere: (req) =>
    req.user!.role === "TECHNICIAN" ? { job: { assignedToId: req.user!.userId } } : undefined,
  createMiddleware: [verifyJobAssignment((req) => req.body?.jobId)],
});
