import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("displays the main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Morningstar Solution");
  });

  test("displays the description", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Engineering Reality Platform/i)).toBeVisible();
  });

  test("has a working Get Started button", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /get started/i });
    await expect(button).toBeVisible();
  });

  test("redirects unauthenticated visitors away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });
});
