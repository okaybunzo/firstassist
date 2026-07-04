import type { RequestHandler } from "express";
import { prisma } from "../db";

/**
 * Blocks a technician from creating a record (issue, checklist result, attachment)
 * against a job that isn't assigned to them. Office/admin are unrestricted.
 */
export function verifyJobAssignment(getJobId: (req: Parameters<RequestHandler>[0]) => string | undefined): RequestHandler {
  return async (req, res, next) => {
    if (req.user!.role !== "TECHNICIAN") return next();

    const jobId = getJobId(req);
    if (!jobId) return res.status(400).json({ error: "jobId is required" });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
