import { Router } from "express";
import { prisma } from "../db";
import { generateJobReportPdf } from "../services/pdf";
import { asyncHandler } from "./asyncHandler";

export const reportsRouter = Router();

reportsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({
      include: { job: true },
      orderBy: { generatedAt: "desc" },
    });
    res.json(reports);
  })
);

// Generates a PDF maintenance report for a completed job and stores it on local disk.
reportsRouter.post(
  "/jobs/:jobId",
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: {
        site: { include: { client: true } },
        asset: true,
        issues: true,
        checklistResults: { include: { form: { include: { fields: true } }, answers: true } },
      },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const { fileName, filePath } = generateJobReportPdf(job);

    const report = await prisma.report.create({
      data: {
        jobId: job.id,
        filePath,
        fileName,
        generatedBy: req.body?.generatedBy,
      },
    });

    res.status(201).json(report);
  })
);

reportsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
