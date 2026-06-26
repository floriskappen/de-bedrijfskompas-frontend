import { test, expect } from "@playwright/test";
import { BYOK_SPEND_STORAGE_KEY, BYOK_STORAGE_KEY } from "../src/lib/byok";

test.describe("byok cost transparency", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("connection management surface shows cumulative spend and history", async ({ page }) => {
    await page.addInitScript(
      ({ byokKey, spendKey }) => {
        window.localStorage.setItem(byokKey, JSON.stringify({
          providerId: "openrouter",
          modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
          saveKey: true,
          hasSavedKey: true,
          savedKey: "sk-saved",
          allowanceUsd: 1,
          confirmedAt: "2026-06-01T00:00:00.000Z",
        }));
        window.localStorage.setItem(spendKey, JSON.stringify([
          {
            id: "s1",
            purpose: "ikigai-pass-1",
            costUsd: 0.25,
            costSource: "provider",
            totalTokens: 15,
            timestamp: "2026-06-25T10:00:00.000Z",
          },
        ]));
      },
      { byokKey: BYOK_STORAGE_KEY, spendKey: BYOK_SPEND_STORAGE_KEY }
    );

    await page.goto("/");

    // A saved key is present → the settings button opens the management surface,
    // where cumulative spend + history live (moved out of the first-run sheet).
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");

    await expect(page.locator("#byok-spend")).toContainText("0.2500");
    await expect(page.locator("#byok-spend")).toContainText("1.0000 usd");
    await expect(page.locator("#byok-spend-history")).toContainText("bedrijven voorselecteren");
    await expect(page.locator("#byok-spend-history")).toContainText("0.2500");
  });

  test("live cost shows pending then real usage", async ({ page }) => {
    // Delay the provider response so the in-flight "pending" state is observable,
    // then land a real usage cost. The content is intentionally not valid ISCO
    // JSON — the boundary lands the cost from real usage before the runner parses,
    // so the spend is recorded regardless of the runner's subsequent parse.
    await page.route("https://openrouter.ai/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const sse = [
        'data: {"choices":[{"delta":{"content":"x"}}]}',
        'data: {"choices":[],"usage":{"cost":0.0123}}',
        "data: [DONE]",
        "",
      ].join("\n\n");
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: sse });
    });

    await page.goto("/");

    // Open the Ikigai flow via the filter-panel entry; with no key the gate
    // opens the first-run setup.
    await page.locator("#filters-button").click();
    await page.locator("#ikigai-filter-entry").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await page.locator("#byok-api-key-input").fill("sk-cost");
    await page.locator("#byok-save-key").check();
    await page.locator("#byok-confirm").click();

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

    // During the in-flight ISCO derivation the app-level cost overlay appears and
    // shows pending — it lives apart from the flow so the cost survives the flow's
    // own screen transitions.
    await expect(page.locator("#byok-cost-overlay")).toContainText("in afwachting");

    // The response lands; the derive then fails to parse the content, surfacing
    // an error — but the real cost has already been recorded.
    await expect(page.locator("#ikigai-error")).toBeVisible();

    // Reload: the session key is gone. The saved key opens the management surface
    // (where spend lives), showing the recorded cost.
    await page.evaluate(() => {
      window.localStorage.removeItem("de-bedrijfskompas:ikigai:v1");
      window.localStorage.removeItem("de-bedrijfskompas:ikigai-draft:v1");
    });
    await page.reload();
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toBeVisible();
    await expect(page.locator("#byok-spend")).toContainText("0.0123");
  });
});
