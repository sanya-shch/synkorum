import { test, expect } from "@playwright/test";
import { seedVerifiedUser, cleanupSeededUser } from "./fixtures/seed";

// A lighter complement to collaboration.spec.ts: these don't touch Liveblocks at
// all, just the login/register pages and the auth API routes behind them, so they
// still catch a real regression even if LIVEBLOCKS_SECRET_KEY isn't configured.

test.describe("login", () => {
  let user: Awaited<ReturnType<typeof seedVerifiedUser>>;

  test.beforeAll(async () => {
    user = await seedVerifiedUser();
  });

  test.afterAll(async () => {
    await cleanupSeededUser(user.email);
  });

  test("a verified user can log in and lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await page.waitForURL("/dashboard");
  });

  test("shows the same error for a wrong password as for an unknown email", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    const wrongPasswordMessage = await page.locator("p.text-red-600").textContent();
    expect(wrongPasswordMessage).toBeTruthy();

    await page.reload();
    await page.getByPlaceholder("Email").fill("someone-who-does-not-exist@example.com");
    await page.getByPlaceholder("Password").fill("whatever-123");
    await page.getByRole("button", { name: "Log in" }).click();

    const unknownEmailMessage = await page.locator("p.text-red-600").textContent();
    expect(unknownEmailMessage).toBe(wrongPasswordMessage);
  });
});

test.describe("register", () => {
  test("registering with an email that's already taken shows a clear error", async ({ page }) => {
    const user = await seedVerifiedUser();

    try {
      await page.goto("/register");
      await page.getByPlaceholder("Name").fill("Someone Else");
      await page.getByPlaceholder("Email").fill(user.email);
      await page.getByPlaceholder("Password").fill("another-password-123");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.locator("p.text-red-600")).toContainText(/already exists/i);
    } finally {
      await cleanupSeededUser(user.email);
    }
  });
});
