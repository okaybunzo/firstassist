import { Router } from "express";
import { asyncHandler } from "./asyncHandler";

type Delegate = {
  findMany: (args?: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

/**
 * Builds a basic REST CRUD router for a Prisma model delegate.
 * Entity-specific validation/relations belong in a dedicated router instead.
 */
export function crudRouter(delegate: Delegate, options?: { include?: any; orderBy?: any }) {
  const router = Router();
  const include = options?.include;
  const orderBy = options?.orderBy ?? { createdAt: "desc" };

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const items = await delegate.findMany({ include, orderBy });
      res.json(items);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await delegate.findUnique({ where: { id: req.params.id }, include });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const created = await delegate.create({ data: req.body, include });
      res.status(201).json(created);
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const updated = await delegate.update({ where: { id: req.params.id }, data: req.body, include });
      res.json(updated);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    })
  );

  return router;
}
