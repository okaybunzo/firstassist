import { prisma } from "../db";
import { crudRouter } from "./crudFactory";

export const maintenanceSchedulesRouter = crudRouter(prisma.maintenanceSchedule, {
  include: { asset: true },
});
