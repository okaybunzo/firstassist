import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const sitesRouter = crudRouter(prisma.site, { include: { client: true, assets: true } });
