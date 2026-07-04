import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const testImagePath = fileURLToPath(new URL("./fixtures/test.png", import.meta.url));

test("job detail: checklist, issue, photo, and report", async ({ page }) => {
  await login(page);

  const suffix = Date.now();
  const formName = `E2E Checklist ${suffix}`;
  const jobTitle = `E2E Job ${suffix}`;

  // Create an inspection form template with one SELECT field.
  await page.goto("/inspection-forms");
  await page.fill(".entity-form input >> nth=0", formName);
  await page.click(".entity-form button[type=submit]");
  await page.locator("table tbody tr", { hasText: formName }).getByText("View").click();

  await page.fill(".inline-form input >> nth=0", "Condition");
  await page.selectOption(".inline-form select", "SELECT");
  await page.fill(".inline-form input >> nth=1", "Good,Fair,Poor");
  await page.click(".inline-form button:has-text('Add field')");
  await expect(page.locator("table tbody tr")).toContainText("Condition");

  // Create a job against the first available site.
  await page.goto("/jobs");
  await page.selectOption(".entity-form select >> nth=0", { index: 1 });
  await page.fill(".entity-form input >> nth=0", jobTitle);
  await page.click(".entity-form button[type=submit]");
  await page.locator("table tbody tr", { hasText: jobTitle }).getByText("View").click();
  await expect(page.locator("h2")).toHaveText(jobTitle);

  // Submit the checklist.
  const formPicker = page.locator("select").filter({ has: page.locator("option", { hasText: formName }) });
  await formPicker.selectOption({ label: formName });
  const answerSelect = page.locator("select").filter({ has: page.locator("option", { hasText: "Good" }) });
  await answerSelect.selectOption("Good");
  await page.click(".inline-form button:has-text('Submit checklist')");
  await expect(page.getByText("Condition: Good")).toBeVisible();

  // Add an issue.
  const issueText = `E2E issue ${suffix}`;
  await page.fill(".detail-section textarea", issueText);
  await page.click(".detail-section button:has-text('Add issue')");
  await expect(page.getByText(issueText)).toBeVisible();

  // Upload a job photo.
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.last().setInputFiles(testImagePath);
  await expect(page.locator(".attachment-item img").last()).toBeVisible();

  // Generate the PDF report.
  await page.click("button:has-text('Generate PDF report')");
  await expect(page.locator("a[href$='.pdf']")).toBeVisible();
});
