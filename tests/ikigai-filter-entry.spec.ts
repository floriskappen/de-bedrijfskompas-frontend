import { test, expect } from "@playwright/test";

// The Ikigai matching entry moved from a dedicated chrome button into the filter
// panel as an advanced filter affordance. Activating it starts the matching
// entry path: the BYOK gate opens the first-run setup when no confirmed
// configuration is available, and opens the Ikigai matching flow when one is.

test.describe("ikigai filter-panel entry", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("ikigai entry opens BYOK setup when unconfigured", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("de-bedrijfskompas:byok-llm:v1");
    });
    await page.goto("/");

    await page.locator("#filters-button").click();
    await expect(page.locator("#filters-panel")).toBeVisible();
    await page.locator("#ikigai-filter-entry").click();

    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "onboarding");
    // The Ikigai gate uses the bottom-sheet onboarding popover, not the
    // full-screen settings surface; opening it also closes the filter panel.
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-variant", "onboarding");
    await expect(page.locator(".byok-settings-fullscreen")).toHaveCount(0);
    await expect(page.locator("#filters-panel")).toHaveCount(0);
  });

  test("ikigai entry opens the matching flow", async ({ page }) => {
    await page.goto("/");

    // Confirm a key first via the settings sheet (no continuation).
    await page.locator("#byok-settings-button").click();
    await page.locator("#byok-api-key-input").fill("sk-ikigai");
    await page.locator("#byok-confirm").click();

    // The filter-panel entry now opens the matching flow directly (session key).
    await page.locator("#filters-button").click();
    await page.locator("#ikigai-filter-entry").click();

    await expect(page.locator("#ikigai-flow")).toBeVisible();
    await expect(page.locator("#filters-panel")).toHaveCount(0);
  });
});
