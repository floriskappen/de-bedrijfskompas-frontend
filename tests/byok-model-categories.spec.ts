import { test, expect } from "@playwright/test";

test.describe("byok model category chooser", () => {
  test("visitor chooses within a category", async ({ page }) => {
    await page.goto("/");

    // Open the Ikigai flow via the filter-panel entry; with no key the gate opens
    // the first-run setup, which surfaces the model chooser.
    await page.locator("#filters-button").click();
    const entry = page.locator("#ikigai-filter-entry");
    await expect(entry).toBeVisible();
    await entry.click();

    const dialog = page.locator("#byok-setup");
    await expect(dialog).toBeVisible();

    const modelField = page.locator("#byok-model");
    await expect(modelField).toBeVisible();

    const tagName = await modelField.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("select");

    const optionCount = await modelField.locator("option").count();
    expect(optionCount).toBeGreaterThanOrEqual(1);

    await page.locator("#byok-api-key-input").fill("sk-playwright");
    await page.locator("#byok-confirm").click();
    await expect(page.locator("#ikigai-flow")).toBeVisible();
  });
});
