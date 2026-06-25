import { test, expect } from "@playwright/test";

test.describe("byok model category chooser", () => {
  test("visitor chooses within a category", async ({ page }) => {
    await page.goto("/");

    const button = page.locator("#ikigai-button");
    await expect(button).toBeVisible();
    await button.click();

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
