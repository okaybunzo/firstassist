import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./helpers";

test.describe("authentication", () => {
  test("redirects an unauthenticated visitor to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
  });

  test("shows an error for a bad password", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", ADMIN_EMAIL);
    await page.fill("input[type=password]", "wrong-password");
    await page.click("button[type=submit]");
    await expect(page.locator(".error")).toHaveText("Invalid email or password");
  });

  test("logs in, shows the current user, and logs out", async ({ page }) => {
    await login(page);
    await expect(page.locator(".nav-user span")).not.toBeEmpty();

    await page.click("text=Log out");
    await page.waitForURL("**/login");

    await page.goto("/jobs");
    await page.waitForURL("**/login");
  });
});
