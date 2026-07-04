import { prisma } from "../db";
import { verifyJobAssignment } from "../middleware/verifyJobAssignment";
import { crudRouter } from "./crudFactory";

export const checklistResultsRouter = crudRouter(prisma.checklistResult, {
  include: { form: { include: { fields: true } }, answers: true },
  orderBy: { submittedAt: "desc" },
  scopeWhere: (req) =>
    req.user!.role === "TECHNICIAN" ? { job: { assignedToId: req.user!.userId } } : undefined,
  createMiddleware: [verifyJobAssignment((req) => req.body?.jobId)],
});
