import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("creates and deletes a client", async ({ page }) => {
  await login(page);

  const clientName = `E2E Test Client ${Date.now()}`;
  await page.fill(".entity-form input >> nth=0", clientName);
  await page.click(".entity-form button[type=submit]");

  const row = page.locator("table tbody tr", { hasText: clientName });
  await expect(row).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(row).not.toBeVisible();
});
