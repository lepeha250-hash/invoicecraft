import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/InvoiceCraft/);
});

test("unauthenticated billing redirects to login", async ({ page }) => {
  await page.goto("/en/billing");
  await expect(page).toHaveURL(/\/en\/auth\/login/);
});

test("unauthenticated dashboard redirects to login", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/auth\/login/);
});