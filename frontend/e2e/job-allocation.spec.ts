import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("admin allocates a job; the assigned technician sees only that job", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin);

  const suffix = Date.now();
  const techEmail = `e2e-tech-${suffix}@example.com`;
  const techName = `E2E Tech ${suffix}`;

  const createUser = await admin.evaluate(
    async ({ email, name }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: "e2e-tech-pass-123", role: "TECHNICIAN" }),
      });
      return res.status;
    },
    { email: techEmail, name: techName }
  );
  expect(createUser).toBe(201);

  // Allocate a job to the new technician.
  await admin.goto("/jobs");
  await admin.selectOption(".entity-form select >> nth=0", { index: 1 });
  const jobTitle = `E2E Allocation Job ${suffix}`;
  await admin.fill(".entity-form input >> nth=0", jobTitle);
  const assignSelect = admin
    .locator(".entity-form select")
    .filter({ has: admin.locator("option", { hasText: techName }) });
  await assignSelect.selectOption({ label: techName });
  await admin.click(".entity-form button[type=submit]");
  await expect(admin.locator("table tbody tr", { hasText: jobTitle })).toContainText(techName);

  // The technician logs in and sees only their allocated job.
  const techContext = await browser.newContext();
  const tech = await techContext.newPage();
  await login(tech, techEmail, "e2e-tech-pass-123");
  await expect(tech).toHaveURL(/\/jobs$/);
  await expect(tech.locator("nav")).not.toContainText("Clients");
  await expect(tech.locator("nav")).toContainText("My Jobs");

  const rows = tech.locator("table tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(jobTitle);

  // Opening the job works, and there's no reassignment control for a technician.
  await rows.first().getByText("View").click();
  await expect(tech.locator("h2")).toHaveText(jobTitle);
  await expect(tech.locator(".inline-form select", { hasText: techName })).toHaveCount(0);

  await adminContext.close();
  await techContext.close();
});
