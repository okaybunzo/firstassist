import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { UPLOADS_DIR } from "./storage";

interface JobForReport {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  notes: string | null;
  site: { name: string; address: string | null; client: { name: string } };
  asset: { name: string; assetType: string | null; serialNumber: string | null } | null;
  issues: Array<{ description: string; severity: string; status: string }>;
  checklistResults: Array<{
    form: { name: string; fields: Array<{ id: string; label: string }> };
    answers: Array<{ fieldId: string; value: string | null }>;
  }>;
}

/** Renders a maintenance report PDF to disk and returns its filename + relative path. */
export function generateJobReportPdf(job: JobForReport): { fileName: string; filePath: string } {
  const fileName = `job-${job.id}-report-${Date.now()}.pdf`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Maintenance Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(14).text(job.title);
  doc.fontSize(10).fillColor("gray");
  doc.text(`Type: ${job.type}    Status: ${job.status}`);
  doc.text(`Client: ${job.site.client.name}`);
  doc.text(`Site: ${job.site.name}${job.site.address ? " — " + job.site.address : ""}`);
  if (job.asset) {
    doc.text(
      `Asset: ${job.asset.name}${job.asset.assetType ? ` (${job.asset.assetType})` : ""}${
        job.asset.serialNumber ? ` — S/N ${job.asset.serialNumber}` : ""
      }`
    );
  }
  if (job.scheduledDate) doc.text(`Scheduled: ${job.scheduledDate.toDateString()}`);
  if (job.completedDate) doc.text(`Completed: ${job.completedDate.toDateString()}`);
  doc.fillColor("black");
  doc.moveDown();

  if (job.notes) {
    doc.fontSize(12).text("Notes", { underline: true });
    doc.fontSize(10).text(job.notes);
    doc.moveDown();
  }

  if (job.checklistResults.length > 0) {
    doc.fontSize(12).text("Inspection Results", { underline: true });
    for (const result of job.checklistResults) {
      doc.fontSize(11).text(result.form.name);
      const answerByField = new Map(result.answers.map((a) => [a.fieldId, a.value]));
      for (const field of result.form.fields) {
        doc.fontSize(10).text(`  ${field.label}: ${answerByField.get(field.id) ?? "-"}`);
      }
      doc.moveDown(0.5);
    }
    doc.moveDown();
  }

  if (job.issues.length > 0) {
    doc.fontSize(12).text("Issues / Defects", { underline: true });
    for (const issue of job.issues) {
      doc.fontSize(10).text(`  [${issue.severity}] ${issue.description} (${issue.status})`);
    }
    doc.moveDown();
  }

  doc.end();

  return { fileName, filePath: fileName };
}
