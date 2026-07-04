import type { Request, RequestHandler } from "express";
import { Router } from "express";
import { asyncHandler } from "./asyncHandler";

type Delegate = {
  findMany: (args?: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

interface CrudRouterOptions {
  include?: any;
  orderBy?: any;
  /** Restricts list/get results, e.g. so a technician only sees their own jobs. */
  scopeWhere?: (req: Request) => Record<string, unknown> | undefined;
  /** Extra middleware run before create, e.g. to verify access to a related record. */
  createMiddleware?: RequestHandler[];
}

/**
 * Builds a basic REST CRUD router for a Prisma model delegate.
 * Entity-specific validation/relations belong in a dedicated router instead.
 */
export function crudRouter(delegate: Delegate, options?: CrudRouterOptions) {
  const router = Router();
  const include = options?.include;
  const orderBy = options?.orderBy ?? { createdAt: "desc" };
  const scopeWhere = options?.scopeWhere ?? (() => undefined);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const items = await delegate.findMany({ where: scopeWhere(req), include, orderBy });
      res.json(items);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await delegate.findFirst({ where: { id: req.params.id, ...scopeWhere(req) }, include });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    })
  );

  router.post(
    "/",
    ...(options?.createMiddleware ?? []),
    asyncHandler(async (req, res) => {
      const created = await delegate.create({ data: req.body, include });
      res.status(201).json(created);
    })
  );

  async function assertInScope(req: Request) {
    const scope = scopeWhere(req);
    if (!scope) return true;
    const item = await delegate.findFirst({ where: { id: req.params.id, ...scope } });
    return Boolean(item);
  }

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      if (!(await assertInScope(req))) return res.status(404).json({ error: "Not found" });
      const updated = await delegate.update({ where: { id: req.params.id }, data: req.body, include });
      res.json(updated);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      if (!(await assertInScope(req))) return res.status(404).json({ error: "Not found" });
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    })
  );

  return router;
}
