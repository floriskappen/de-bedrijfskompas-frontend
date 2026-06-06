import { test, expect, type Page } from "@playwright/test";

const NL_AXES = ["INHOUD", "ECOLOGIE", "MACHT", "VERANKERING", "HOUDING"];

// The axis list is a `client:load` island; its buttons exist in the SSR HTML
// before React attaches handlers, so a click fired too early is dropped. Astro
// removes the `ssr` attribute once an island finishes hydrating — wait on that
// before interacting.
async function waitForHydration(page: Page) {
  await page.waitForFunction(() => !!document.querySelector("astro-island:not([ssr])"));
}

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
    await waitForHydration(page);

    const ecology = page.locator('button[data-axis="ecology"]');
    await ecology.click();
    await expect(ecology).toHaveAttribute("aria-expanded", "true");

    const infoLink = page.locator('a[data-axis-info="ecology"]');
    await expect(infoLink).toBeVisible();
    await expect(infoLink).toHaveAttribute("href", "/as/ecology/?from=land-life-company");
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

  // detail footer shows real last-checked time
  test("detail footer shows real last-checked time", async ({ page }) => {
    await page.goto("/land-life-company/");

    // the footer is derived from the company's real updated_at timestamp; we
    // can't assert the exact relative phrase (it moves with build time), but it
    // carries the localized "gecheckt" prefix and stays lowercase.
    const footer = page.getByText("gecheckt", { exact: false });
    await expect(footer).toBeVisible();
    const text = (await footer.textContent())!.trim();
    expect(text).toBe(text.toLowerCase());
    // a relative-time phrase follows the prefix, not the old fixed copy
    expect(text).not.toBe("gecheckt 12 dagen geleden");
    expect(text.length).toBeGreaterThan("gecheckt".length);
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
    await waitForHydration(page);
    await expect(page.locator("text=tap an axis for context")).toBeVisible();
    await page.locator('button[data-axis="ecology"]').click();
    // the info link carries the originating company as `?from=` so the axis
    // info page can offer a way back
    await expect(page.locator('a[data-axis-info="ecology"]')).toHaveAttribute(
      "href",
      "/en/axis/ecology/?from=land-life-company"
    );
  });
});
