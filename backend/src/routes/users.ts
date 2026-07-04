import { Router } from "express";
import { prisma } from "../db";
import { requireRole } from "../middleware/requireAuth";
import { hashPassword } from "../services/auth";
import { asyncHandler } from "./asyncHandler";

export const usersRouter = Router();

const publicSelect = { id: true, name: true, email: true, role: true, createdAt: true } as const;

usersRouter.get(
  "/",
  requireRole("ADMIN", "OFFICE"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "desc" } });
    res.json(users);
  })
);

usersRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    const user = await prisma.user.create({
      data: { name, email, role, passwordHash: await hashPassword(password) },
      select: publicSelect,
    });
    res.status(201).json(user);
  })
);

usersRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        role,
        passwordHash: password ? await hashPassword(password) : undefined,
      },
      select: publicSelect,
    });
    res.json(user);
  })
);

usersRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
