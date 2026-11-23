import { test, expect, type Page } from "@playwright/test";
import { seedBoardWithEditableShareLink, cleanupSeededUser } from "./fixtures/seed";

// The one thing no unit test can prove: that two independent browser sessions
// editing the same board actually see each other's changes through Liveblocks.
// Everything around it (auth, share-link validity, the mutations themselves) is
// already covered by the Vitest suite - this test exists only for the realtime
// sync path itself. Requires a real database and a real LIVEBLOCKS_SECRET_KEY; see
// e2e/README.md.

let fixture: Awaited<ReturnType<typeof seedBoardWithEditableShareLink>>;

test.beforeAll(async () => {
  fixture = await seedBoardWithEditableShareLink();
});

test.afterAll(async () => {
  await cleanupSeededUser(fixture.ownerEmail);
});

async function loginAsOwner(page: Page, boardId: string) {
  await page.goto(`/login?callbackUrl=/board/${boardId}`);
  await page.getByLabel("Email address").fill(fixture.ownerEmail);
  await page.getByLabel("Password", { exact: true }).fill(fixture.ownerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`/board/${boardId}`);
}

async function joinAsGuest(page: Page, boardId: string, shareLinkToken: string) {
  await page.goto(`/board-link/${shareLinkToken}`);
  await page.waitForURL(`/board/${boardId}`);
}

test.describe("realtime collaboration", () => {
  test("a rectangle inserted by the owner appears live for an anonymous guest", async ({
    browser,
  }) => {
    const ownerContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      const ownerPage = await ownerContext.newPage();
      const guestPage = await guestContext.newPage();

      await loginAsOwner(ownerPage, fixture.boardId);
      await joinAsGuest(guestPage, fixture.boardId, fixture.shareLinkToken);

      await expect(ownerPage.getByTestId("liveblocks-status")).toHaveAttribute(
        "data-status",
        "connected",
      );
      await expect(guestPage.getByTestId("liveblocks-status")).toHaveAttribute(
        "data-status",
        "connected",
      );

      // Both sessions should be looking at an empty board to start.
      await expect(guestPage.locator('[data-layer-type="Rectangle"]')).toHaveCount(0);

      await ownerPage.getByTestId("tool-rectangle").click();
      await ownerPage.getByTestId("canvas-svg").click({ position: { x: 300, y: 300 } });

      // The owner sees their own rectangle immediately...
      await expect(ownerPage.locator('[data-layer-type="Rectangle"]')).toHaveCount(1);

      // ...and, via Liveblocks, so does the guest, with no reload.
      await expect(guestPage.locator('[data-layer-type="Rectangle"]')).toHaveCount(1, {
        timeout: 10_000,
      });
    } finally {
      await ownerContext.close();
      await guestContext.close();
    }
  });

  test("deleting a layer in one session removes it for the other", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      const ownerPage = await ownerContext.newPage();
      const guestPage = await guestContext.newPage();

      await loginAsOwner(ownerPage, fixture.boardId);
      await joinAsGuest(guestPage, fixture.boardId, fixture.shareLinkToken);

      await expect(ownerPage.getByTestId("liveblocks-status")).toHaveAttribute(
        "data-status",
        "connected",
      );
      await expect(guestPage.getByTestId("liveblocks-status")).toHaveAttribute(
        "data-status",
        "connected",
      );

      await ownerPage.getByTestId("tool-ellipse").click();
      await ownerPage.getByTestId("canvas-svg").click({ position: { x: 500, y: 200 } });
      await expect(ownerPage.locator('[data-layer-type="Ellipse"]')).toHaveCount(1);
      await expect(guestPage.locator('[data-layer-type="Ellipse"]')).toHaveCount(1, {
        timeout: 10_000,
      });

      await ownerPage.keyboard.press("Delete");

      await expect(ownerPage.locator('[data-layer-type="Ellipse"]')).toHaveCount(0);
      await expect(guestPage.locator('[data-layer-type="Ellipse"]')).toHaveCount(0, {
        timeout: 10_000,
      });
    } finally {
      await ownerContext.close();
      await guestContext.close();
    }
  });
});
