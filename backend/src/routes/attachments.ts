import { Router } from "express";
import { prisma } from "../db";
import { upload } from "../middleware/upload";
import { asyncHandler } from "./asyncHandler";

export const attachmentsRouter = Router();

attachmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { jobId, assetId, issueId } = req.query;
    const attachments = await prisma.attachment.findMany({
      where: {
        jobId: typeof jobId === "string" ? jobId : undefined,
        assetId: typeof assetId === "string" ? assetId : undefined,
        issueId: typeof issueId === "string" ? issueId : undefined,
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
