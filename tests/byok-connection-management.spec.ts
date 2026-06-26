import { test, expect } from "@playwright/test";
import { BYOK_SPEND_STORAGE_KEY, BYOK_STORAGE_KEY } from "../src/lib/byok";

// The persistent connection-management surface (`03` "After connecting"):
// change model, adjust budget, clear/rotate the key, and view spend history.
// Reached from the map chrome settings button (and, during a run, from the cost
// overlay's manage affordance). Spend/history live here, not in first-run setup.

test.describe("byok connection management surface", () => {
  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
    });
  });

  test("connection management surface is reachable after connecting", async ({ page }) => {
    await page.goto("/");

    // First-run: confirm a session key (no continuation → sheet closes).
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "onboarding");
    await page.locator("#byok-api-key-input").fill("sk-manage");
    await page.locator("#byok-confirm").click();

    // Reopen → management surface (session key present).
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");
    await expect(page.locator("#byok-model")).toBeVisible();
    await expect(page.locator("#byok-allowance-input")).toBeVisible();
    await expect(page.locator("#byok-clear-key")).toBeVisible();
    await expect(page.locator("#byok-rotate-key")).toBeVisible();
    await expect(page.locator("#byok-spend")).toBeVisible();
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
    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");

    // Cumulative spend (derived from local history) + allowance ceiling. The
    // spent figure and the ceiling are shown as distinct facts (no repeated
    // current-spend); the meter carries the ratio visually + as its label.
    await expect(page.locator("#byok-spend")).toContainText("0.2500");
    await expect(page.locator("#byok-spend")).toContainText("1.0000 usd");
    // Recent record attributed to its feature (ikigai-pass-1 → nl label).
    await expect(page.locator("#byok-spend-history")).toContainText("bedrijven voorselecteren");
    await expect(page.locator("#byok-spend-history")).toContainText("0.2500");
  });

  test("clearing the key returns to the first-run state", async ({ page }) => {
    await page.goto("/");

    // Confirm a session key, then open management and clear it.
    await page.locator("#byok-settings-button").click();
    await page.locator("#byok-api-key-input").fill("sk-clear");
    await page.locator("#byok-confirm").click();

    await page.locator("#byok-settings-button").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");
    await page.locator("#byok-clear-key").click();

    // The key is wiped and the surface returns to first-run onboarding.
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "onboarding");
    await expect(page.locator("#byok-api-key-input")).toBeVisible();
    await expect(page.locator("#byok-clear-key")).toHaveCount(0);

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), BYOK_STORAGE_KEY);
    expect(stored).not.toContain("sk-clear");
    expect(stored && JSON.parse(stored).hasSavedKey).toBeFalsy();
  });

  test("clear and rotate are disabled during an in-flight paid request", async ({ page }) => {
    // Delay the provider response so the in-flight state is observable.
    await page.route("https://openrouter.ai/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const sse = [
        'data: {"choices":[{"delta":{"content":"x"}}]}',
        'data: {"choices":[],"usage":{"cost":0.0123}}',
        "data: [DONE]",
        "",
      ].join("\n\n");
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: sse });
    });

    await page.goto("/");

    // Confirm a session key.
    await page.locator("#byok-settings-button").click();
    await page.locator("#byok-api-key-input").fill("sk-inflight");
    await page.locator("#byok-confirm").click();

    // Start an Ikigai run via the filter-panel entry (configured → flow opens).
    await page.locator("#filters-button").click();
    await page.locator("#ikigai-filter-entry").click();
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

    // In-flight: the cost overlay appears; open management from it (the chrome
    // is covered by the fullscreen flow, so the overlay is the reachable path).
    await expect(page.locator("#byok-cost-overlay")).toBeVisible();
    await page.locator("#byok-cost-manage").click();
    await expect(page.locator("#byok-setup")).toHaveAttribute("data-byok-mode", "manage");
    await expect(page.locator("#byok-clear-key")).toBeDisabled();
    await expect(page.locator("#byok-rotate-key")).toBeDisabled();

    // After the stream settles (derive fails to parse → error), the guard lifts
    // and the controls re-enable.
    await expect(page.locator("#ikigai-error")).toBeVisible();
    await expect(page.locator("#byok-clear-key")).toBeEnabled();
    await expect(page.locator("#byok-rotate-key")).toBeEnabled();
  });
});
