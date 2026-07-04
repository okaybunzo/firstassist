import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "./asyncHandler";
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken, verifyPassword } from "../services/auth";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signAuthToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.status(204).send();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);
