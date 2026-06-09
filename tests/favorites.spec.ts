import { test, expect } from "@playwright/test";
import { FAVORITES_STORAGE_KEY } from "../src/lib/favorites";

test.describe("favorites page", () => {
  test("empty dutch favorites page", async ({ page }) => {
    await page.goto("/favorieten/");

    await expect(page.locator("h1")).toHaveText("favorieten");
    await expect(page.locator("#favorites-empty-state")).toHaveText("nog geen favorieten bewaard");
    await expect(page.locator("#favorites-list")).toHaveCount(0);
  });

  test("saved companies render and unknown ids are hidden", async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({ companyIds: ["land-life-company", "unknown-company"] })
        );
      },
      { key: FAVORITES_STORAGE_KEY }
    );
    await page.goto("/favorieten/");

    const favorite = page.locator('[data-favorite-company="land-life-company"]');
    await expect(favorite).toBeVisible();
    await expect(favorite).toContainText("Land Life Company B.V.");
    await expect(favorite.locator('a[href="/land-life-company/?from=favorites"]')).toBeVisible();
    await expect(page.locator('[data-favorite-company="unknown-company"]')).toHaveCount(0);
    await expect(page.locator("#favorites-empty-state")).toHaveCount(0);

    // each card summarizes the company with one focus meter per axis (5 axes)
    await expect(favorite.locator("[data-focus-meter]")).toHaveCount(5);
  });

  test("clicking the card body opens the detail page", async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, JSON.stringify({ companyIds: ["land-life-company"] }));
      },
      { key: FAVORITES_STORAGE_KEY }
    );
    await page.goto("/favorieten/");

    // the whole card is the affordance — clicking the card body (over the meter
    // row, not the name) navigates via the stretched link
    await page.locator('[data-favorite-company="land-life-company"]').click({ position: { x: 40, y: 150 } });
    await expect(page).toHaveURL(/\/land-life-company\/\?from=favorites$/);

    // arriving from favorites, the detail back button returns to the favorites page
    await expect(page.locator('a[aria-label="terug naar favorieten"]')).toHaveAttribute("href", "/favorieten/");
  });

  test("english route renders english favorites page", async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, JSON.stringify({ companyIds: ["land-life-company"] }));
      },
      { key: FAVORITES_STORAGE_KEY }
    );
    await page.goto("/en/favorites/");

    await expect(page.locator("h1")).toHaveText("favorites");
    await expect(page.locator('[data-favorite-company="land-life-company"]')).toContainText(
      /a for-profit company/i
    );
    await expect(page.locator('[data-favorite-company="land-life-company"] a[href="/en/land-life-company/?from=favorites"]')).toBeVisible();
  });
});
