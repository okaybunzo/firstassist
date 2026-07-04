import { beforeAll, describe, expect, it } from "vitest";
import { adminAgent, agentAs } from "./helpers";

describe("job allocation and technician visibility", () => {
  let admin: Awaited<ReturnType<typeof adminAgent>>;
  let tech: Awaited<ReturnType<typeof agentAs>>;
  let siteId: string;
  let myJobId: string;
  let otherJobId: string;

  beforeAll(async () => {
    admin = await adminAgent();

    await admin.post("/api/users").send({
      name: "Field Tech",
      email: "field-tech@example.com",
      password: "tech-password-123",
      role: "TECHNICIAN",
    });
    tech = await agentAs("field-tech@example.com", "tech-password-123");

    const client = await admin.post("/api/clients").send({ name: "Allocation Test Client" });
    const site = await admin
      .post("/api/sites")
      .send({ clientId: client.body.id, name: "Allocation Test Site" });
    siteId = site.body.id;

    const techUser = (await admin.get("/api/users")).body.find(
      (u: { email: string }) => u.email === "field-tech@example.com"
    );

    const myJob = await admin.post("/api/jobs").send({
      siteId,
      title: "Assigned To Tech",
      assignedToId: techUser.id,
    });
    myJobId = myJob.body.id;

    const otherJob = await admin.post("/api/jobs").send({
      siteId,
      title: "Not Assigned To Tech",
    });
    otherJobId = otherJob.body.id;
  });

  it("only lists jobs assigned to the technician", async () => {
    const res = await tech.get("/api/jobs");
    expect(res.status).toBe(200);
    const titles = res.body.map((j: { title: string }) => j.title);
    expect(titles).toContain("Assigned To Tech");
    expect(titles).not.toContain("Not Assigned To Tech");
  });

  it("lets the admin see every job regardless of assignment", async () => {
    const res = await admin.get("/api/jobs");
    const titles = res.body.map((j: { title: string }) => j.title);
    expect(titles).toContain("Assigned To Tech");
    expect(titles).toContain("Not Assigned To Tech");
  });

  it("404s a technician fetching a job that isn't theirs", async () => {
    const res = await tech.get(`/api/jobs/${otherJobId}`);
    expect(res.status).toBe(404);
  });

  it("200s a technician fetching their own job", async () => {
    const res = await tech.get(`/api/jobs/${myJobId}`);
    expect(res.status).toBe(200);
  });

  it("blocks a technician from creating or deleting jobs", async () => {
    const create = await tech.post("/api/jobs").send({ siteId, title: "Tech Attempt" });
    expect(create.status).toBe(403);

    const del = await tech.delete(`/api/jobs/${myJobId}`);
    expect(del.status).toBe(403);
  });

  it("lets a technician update status/notes on their own job but not reassign or retitle it", async () => {
    const res = await tech.put(`/api/jobs/${myJobId}`).send({
      status: "COMPLETED",
      notes: "Finished the work",
      title: "Hacked Title",
      siteId: "some-other-site",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
    expect(res.body.notes).toBe("Finished the work");
    expect(res.body.title).toBe("Assigned To Tech");
  });

  it("404s a technician updating a job that isn't theirs", async () => {
    const res = await tech.put(`/api/jobs/${otherJobId}`).send({ status: "COMPLETED" });
    expect(res.status).toBe(404);
  });

  it("blocks a technician from creating an issue on a job that isn't theirs", async () => {
    const res = await tech.post("/api/issues").send({
      jobId: otherJobId,
      description: "Should be blocked",
      severity: "LOW",
    });
    expect(res.status).toBe(403);
  });

  it("lets a technician create an issue on their own job, and only see their own issues", async () => {
    const created = await tech.post("/api/issues").send({
      jobId: myJobId,
      description: "Visible issue",
      severity: "LOW",
    });
    expect(created.status).toBe(201);

    await admin.post("/api/issues").send({
      jobId: otherJobId,
      description: "Hidden issue",
      severity: "LOW",
    });

    const list = await tech.get("/api/issues");
    const descriptions = list.body.map((i: { description: string }) => i.description);
    expect(descriptions).toContain("Visible issue");
    expect(descriptions).not.toContain("Hidden issue");
  });
});
