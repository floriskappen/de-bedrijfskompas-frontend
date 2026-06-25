import { test, expect } from "@playwright/test";
import { BYOK_STORAGE_KEY } from "../src/lib/byok";
import { IKIGAI_DRAFT_STORAGE_KEY, IKIGAI_STORAGE_KEY } from "../src/lib/ikigai";

test.describe("byok stale-key re-connect", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("cleared key surfaces a re-connect prompt", async ({ page }) => {
    // The real client path runs: a 401 from OpenRouter clears the saved key.
    await page.route("https://openrouter.ai/**", (route) =>
      route.fulfill({ status: 401, contentType: "text/plain", body: "unauthorized" })
    );

    await page.addInitScript(() => {
      window.localStorage.removeItem("de-bedrijfskompas:byok-llm:v1");
      window.localStorage.removeItem("de-bedrijfskompas:ikigai:v1");
      window.localStorage.removeItem("de-bedrijfskompas:ikigai-draft:v1");
    });

    await page.goto("/");

    // Open the Ikigai flow; with no key it opens the BYOK setup. Save the key
    // so the saved-key reuse button is offered on a later visit.
    await page.locator("#ikigai-button").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await page.locator("#byok-api-key-input").fill("sk-reconnect");
    await page.locator("#byok-save-key").check();
    await page.locator("#byok-confirm").click();

    // Run the wizard through to ISCO derivation, which calls the provider and
    // hits the stubbed 401.
    await expect(page.locator("#ikigai-flow")).toBeVisible();
    const answers = [
      "ik bouw software voor organisaties",
      "systemen ontwerpen, programmeren, productdenken",
      "menselijke zorg, rust en praktisch nut",
      "kleine teams met autonomie",
    ];
    for (const answer of answers) {
      await page.locator("#ikigai-flow textarea").fill(answer);
      await page.locator("#ikigai-next").click();
    }

    // The 401 is normalized to invalid_key, the key is cleared, and the flow
    // surfaces the localized invalid-key error.
    await expect(page.locator("#ikigai-error")).toBeVisible();
    await expect(page.locator("#ikigai-error")).toContainText("de api-sleutel wordt niet geaccepteerd");

    // Retry re-requests BYOK; because the key was cleared this re-opens the
    // setup surface in the enter-key state — the saved-key reuse button is gone.
    await page.getByRole("button", { name: "opnieuw proberen" }).click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-saved-key-confirm")).toHaveCount(0);
    await expect(page.locator("#byok-api-key-input")).toBeVisible();
  });
});
