import { test, expect } from "@playwright/test";

// The BYOM settings chrome button is always-visible and two-mode: it opens the
// connection-management surface when a key is present (saved or session), and
// the first-run setup when no key is configured.

test.describe("byok settings chrome entry", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("connection-management button opens first-run setup", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("de-bedrijfskompas:byok-llm:v1");
    });
    await page.goto("/");

    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "onboarding");
    // The chrome gear presents the settings entry as a full-screen in-app
    // surface (not the bottom-sheet popover the Ikigai gate uses).
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-variant", "settings");
    await expect(page.locator(".byok-settings-fullscreen")).toBeVisible();
    await expect(page.locator("#byok-api-key-input")).toBeVisible();
  });

  test("connection-management button opens the management surface", async ({ page }) => {
    await page.goto("/");

    // First-run: confirm a session key (no continuation → sheet closes).
    await page.locator("#byok-settings-button").click();
    await page.locator("#byok-api-key-input").fill("sk-manage");
    await page.locator("#byok-confirm").click();

    // Reopen: a session key is now present → management surface.
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-variant", "settings");
    await expect(page.locator(".byok-settings-fullscreen")).toBeVisible();
    await expect(page.locator("#byok-clear-key")).toBeVisible();
  });
});
