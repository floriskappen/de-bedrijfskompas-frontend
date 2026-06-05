import { test, expect } from "@playwright/test";

const NL_AXES = ["INHOUD", "ECOLOGIE", "MACHT", "VERANKERING", "HOUDING"];

test.describe("company-detail E2E tests", () => {
  // nl detail page shows header pentagon and axes
  test("nl detail page shows header pentagon and axes", async ({ page }) => {
    await page.goto("/land-life-company/");

    // identity header
    await expect(page.locator("h1")).toHaveText("Land Life Company B.V.");
    // pentagon with all five site axis labels
    for (const axis of NL_AXES) {
      await expect(page.locator(`svg text:text-is("${axis}")`)).toBeVisible();
    }
    // five tappable axis rows
    await expect(page.locator("button[data-axis]")).toHaveCount(5);
  });

  // expanding an axis reveals reason and info link
  test("expanding an axis reveals reason and info link", async ({ page }) => {
    await page.goto("/land-life-company/");

    const ecology = page.locator('button[data-axis="ecology"]');
    await ecology.click();
    await expect(ecology).toHaveAttribute("aria-expanded", "true");

    const infoLink = page.locator('a[data-axis-info="ecology"]');
    await expect(infoLink).toBeVisible();
    await expect(infoLink).toHaveAttribute("href", "/as/ecology/");
    // reason prose sits in the expanded panel
    await expect(infoLink.locator("xpath=preceding-sibling::p")).toBeVisible();
  });

  // null-score axis renders no-signal state
  test("null-score axis renders no-signal state", async ({ page }) => {
    await page.goto("/land-life-company/");

    // power has a null score → "?" glyph in the pentagon
    await expect(page.locator('svg text:text-is("?")')).toBeVisible();
    // and a de-emphasized "geen signaal" evidence label on its row
    const power = page.locator('button[data-axis="power"]');
    await expect(power).toContainText("geen signaal");
  });

  // website link and en locale
  test("website link and en locale", async ({ page }) => {
    // website link points at the company's site
    await page.goto("/land-life-company/");
    const website = page.locator("#company-website-link");
    await expect(website).toBeVisible();
    const href = await website.getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);

    // english route renders english chrome + axis info link prefix
    await page.goto("/en/land-life-company/");
    await expect(page.locator("text=tap an axis for context")).toBeVisible();
    await page.locator('button[data-axis="ecology"]').click();
    await expect(page.locator('a[data-axis-info="ecology"]')).toHaveAttribute(
      "href",
      "/en/axis/ecology/"
    );
  });
});
