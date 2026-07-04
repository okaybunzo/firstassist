import { Router } from "express";
import { prisma } from "../db";
import { upload } from "../middleware/upload";
import { asyncHandler } from "./asyncHandler";

export const attachmentsRouter = Router();

/** For technicians, resolves the job (if any) that a job/issue-scoped attachment belongs to. */
async function resolveJobId(jobId?: string, issueId?: string): Promise<string | undefined> {
  if (jobId) return jobId;
  if (issueId) return (await prisma.issue.findUnique({ where: { id: issueId } }))?.jobId;
  return undefined;
}

async function assertTechnicianCanAccessJob(userId: string, jobId: string | undefined) {
  if (!jobId) return true;
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  return job?.assignedToId === userId;
}

attachmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { jobId, assetId, issueId } = req.query;
    const jobIdStr = typeof jobId === "string" ? jobId : undefined;
    const issueIdStr = typeof issueId === "string" ? issueId : undefined;

    if (req.user!.role === "TECHNICIAN") {
      const resolvedJobId = await resolveJobId(jobIdStr, issueIdStr);
      if (resolvedJobId && !(await assertTechnicianCanAccessJob(req.user!.userId, resolvedJobId))) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        jobId: jobIdStr,
        assetId: typeof assetId === "string" ? assetId : undefined,
        issueId: issueIdStr,
      },
      orderBy: { uploadedAt: "desc" },
    });
    res.json(attachments);
  })
);

// Uploads a job/asset/issue photo or attachment to local disk storage.
attachmentsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { jobId, assetId, issueId } = req.body;

    if (req.user!.role === "TECHNICIAN") {
      const resolvedJobId = await resolveJobId(jobId || undefined, issueId || undefined);
      if (resolvedJobId && !(await assertTechnicianCanAccessJob(req.user!.userId, resolvedJobId))) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const attachment = await prisma.attachment.create({
      data: {
        filePath: req.file.filename,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        jobId: jobId || undefined,
        assetId: assetId || undefined,
        issueId: issueId || undefined,
      },
    });

    res.status(201).json(attachment);
  })
);

attachmentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.attachment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
