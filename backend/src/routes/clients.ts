import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const clientsRouter = crudRouter(prisma.client, { include: { sites: true } });
