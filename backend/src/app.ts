import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/requireAuth";
import { UPLOADS_DIR, ensureUploadsDir } from "./services/storage";

import { assetsRouter } from "./routes/assets";
import { attachmentsRouter } from "./routes/attachments";
import { authRouter } from "./routes/auth";
import { checklistResultsRouter } from "./routes/checklistResults";
import { clientsRouter } from "./routes/clients";
import { inspectionFormFieldsRouter } from "./routes/inspectionFormFields";
import { inspectionFormsRouter } from "./routes/inspectionForms";
import { issuesRouter } from "./routes/issues";
import { jobsRouter } from "./routes/jobs";
import { maintenanceSchedulesRouter } from "./routes/maintenanceSchedules";
import { partsRouter } from "./routes/parts";
import { quoteItemsRouter } from "./routes/quoteItems";
import { reportsRouter } from "./routes/reports";
import { sitesRouter } from "./routes/sites";
import { usersRouter } from "./routes/users";

ensureUploadsDir();

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", requireAuth, express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);

app.use("/api", requireAuth);

app.use("/api/clients", clientsRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/maintenance-schedules", maintenanceSchedulesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/inspection-forms", inspectionFormsRouter);
app.use("/api/inspection-form-fields", inspectionFormFieldsRouter);
app.use("/api/checklist-results", checklistResultsRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/parts", partsRouter);
app.use("/api/quote-items", quoteItemsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/attachments", attachmentsRouter);
app.use("/api/users", usersRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
