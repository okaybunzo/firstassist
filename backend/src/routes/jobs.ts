import { Router } from "express";
import { prisma } from "../db";
import { requireRole } from "../middleware/requireAuth";
import { asyncHandler } from "./asyncHandler";

export const jobsRouter = Router();

const include = {
  site: { include: { client: true } },
  asset: true,
  assignedTo: true,
  issues: true,
  attachments: true,
  checklistResults: {
    include: { form: { include: { fields: { orderBy: { order: "asc" as const } } } }, answers: true },
  },
  reports: true,
};

// Technicians only see jobs allocated to them; office/admin see and allocate everything.
const TECHNICIAN_EDITABLE_FIELDS = ["status", "notes", "completedDate"] as const;

jobsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = req.user!.role === "TECHNICIAN" ? { assignedToId: req.user!.userId } : undefined;
    const jobs = await prisma.job.findMany({ where, include, orderBy: { createdAt: "desc" } });
    res.json(jobs);
  })
);

jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const where =
      req.user!.role === "TECHNICIAN"
        ? { id: req.params.id, assignedToId: req.user!.userId }
        : { id: req.params.id };
    const job = await prisma.job.findFirst({ where, include });
    if (!job) return res.status(404).json({ error: "Not found" });
    res.json(job);
  })
);

jobsRouter.post(
  "/",
  requireRole("ADMIN", "OFFICE"),
  asyncHandler(async (req, res) => {
    const created = await prisma.job.create({ data: req.body, include });
    res.status(201).json(created);
  })
);

jobsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.role === "TECHNICIAN") {
      const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.assignedToId !== req.user!.userId) {
        return res.status(404).json({ error: "Not found" });
      }
      const data: Record<string, unknown> = {};
      for (const field of TECHNICIAN_EDITABLE_FIELDS) {
        if (field in req.body) data[field] = req.body[field];
      }
      const updated = await prisma.job.update({ where: { id: req.params.id }, data, include });
      return res.json(updated);
    }

    const updated = await prisma.job.update({ where: { id: req.params.id }, data: req.body, include });
    res.json(updated);
  })
);

jobsRouter.delete(
  "/:id",
  requireRole("ADMIN", "OFFICE"),
  asyncHandler(async (req, res) => {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
