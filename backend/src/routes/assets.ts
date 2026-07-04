import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const assetsRouter = crudRouter(prisma.asset, {
  include: { site: true, maintenanceSchedules: true },
});
