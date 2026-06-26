import { test, expect } from "@playwright/test";

// BYOM `03-wizard-ux-contract.md` must-cover items 1 (what connecting does /
// costs), 2 (get a key), 6 (honest threat model), and the `02` "require both"
// provider spend-limit prompt. The first-run setup sheet is the lean first-run
// instance of the persistent connection surface, reached from the map chrome
// settings button when no key is configured.

test.describe("byok first-time key holder onboarding", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("first-run setup explains connecting and costs", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("de-bedrijfskompas:byok-llm:v1");
      window.localStorage.removeItem("de-bedrijfskompas:byok-spend:v1");
    });
    await page.goto("/");

    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "onboarding");
    // localized (nl) onboarding copy: a language model, you bring your own key,
    // and you pay openrouter directly.
    await expect(page.locator("#byok-onboarding")).toContainText("taalmodel");
    await expect(page.locator("#byok-onboarding")).toContainText("openrouter");
  });

  test("first-run setup links to obtain a key", async ({ page }) => {
    await page.goto("/");
    await page.locator("#byok-settings-button").click();

    const link = page.locator("#byok-get-key-link");
    await expect(link).toHaveAttribute("href", "https://openrouter.ai/keys");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("first-run setup prompts the provider spend limit", async ({ page }) => {
    await page.goto("/");
    await page.locator("#byok-settings-button").click();

    const link = page.locator("#byok-spend-limit-link");
    await expect(link).toHaveAttribute("href", "https://openrouter.ai/settings/credits");
    await expect(page.locator("#byok-onboarding")).toContainText("uitgavelimiet");
    // no acknowledgment gate: confirm is enabled without checking anything.
    await expect(page.locator("#byok-confirm")).toBeEnabled();
  });

  test("first-run setup restates the honest threat model", async ({ page }) => {
    await page.goto("/");
    await page.locator("#byok-settings-button").click();

    await expect(page.locator("#byok-threat-model")).toContainText("geen cryptografische garantie");
  });
});
