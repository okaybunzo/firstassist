import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { UPLOADS_DIR } from "../src/services/storage";
import { adminAgent } from "./helpers";

describe("job workflow: checklist, issue, attachment, report", () => {
  let agent: Awaited<ReturnType<typeof adminAgent>>;
  let jobId: string;
  let formId: string;
  let fieldId: string;

  beforeAll(async () => {
    agent = await adminAgent();

    const client = await agent.post("/api/clients").send({ name: "Workflow Test Client" });
    const site = await agent
      .post("/api/sites")
      .send({ clientId: client.body.id, name: "Workflow Test Site" });
    const job = await agent.post("/api/jobs").send({
      siteId: site.body.id,
      title: "Workflow Test Job",
      type: "MAINTENANCE",
      status: "IN_PROGRESS",
    });
    jobId = job.body.id;

    const form = await agent
      .post("/api/inspection-forms")
      .send({ name: "Workflow Test Form", description: "test" });
    formId = form.body.id;

    const field = await agent
      .post("/api/inspection-form-fields")
      .send({ formId, label: "Condition", fieldType: "SELECT", options: "Good,Bad", order: 0 });
    fieldId = field.body.id;
  });

  it("submits a checklist result with nested answers", async () => {
    const res = await agent.post("/api/checklist-results").send({
      jobId,
      formId,
      submittedBy: "Tester",
      answers: { create: [{ fieldId, value: "Good" }] },
    });
    expect(res.status).toBe(201);
    expect(res.body.answers).toHaveLength(1);
    expect(res.body.answers[0].value).toBe("Good");
  });

  it("creates an issue tied to the job", async () => {
    const res = await agent.post("/api/issues").send({
      jobId,
      description: "Test issue description",
      severity: "HIGH",
      status: "OPEN",
    });
    expect(res.status).toBe(201);
    expect(res.body.jobId).toBe(jobId);
  });

  it("uploads an attachment scoped to the job", async () => {
    const res = await agent
      .post("/api/attachments")
      .field("jobId", jobId)
      .attach("file", Buffer.from("fake-image-bytes"), "photo.png");
    expect(res.status).toBe(201);
    expect(res.body.jobId).toBe(jobId);

    const list = await agent.get(`/api/attachments?jobId=${jobId}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("generates a PDF maintenance report and writes it to disk", async () => {
    const res = await agent.post(`/api/reports/jobs/${jobId}`).send({});
    expect(res.status).toBe(201);
    expect(res.body.jobId).toBe(jobId);

    const filePath = path.join(UPLOADS_DIR, res.body.filePath);
    expect(fs.existsSync(filePath)).toBe(true);
    const contents = fs.readFileSync(filePath);
    expect(contents.slice(0, 4).toString()).toBe("%PDF");
  });

  it("returns the checklist result nested under the job", async () => {
    const res = await agent.get(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.checklistResults).toHaveLength(1);
    expect(res.body.checklistResults[0].form.name).toBe("Workflow Test Form");
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.reports).toHaveLength(1);
  });
});
