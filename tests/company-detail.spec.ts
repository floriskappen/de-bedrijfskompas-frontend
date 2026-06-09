import { test, expect, type Page } from "@playwright/test";
import { FAVORITES_STORAGE_KEY } from "../src/lib/favorites";

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

  // collapsed axis row leads with the focus-level meter
  test("collapsed axis row shows focus level", async ({ page }) => {
    await page.goto("/land-life-company/");

    // ecology has a numeric score → its row shows a focus-level meter
    const slot = page.locator('[data-axis-level="ecology"]');
    await expect(slot).toHaveAttribute("data-level", /^(low|medium|high)$/);
    await expect(slot.locator("[data-focus-meter]")).toBeVisible();
    await expect(slot).toHaveAttribute("aria-label", /focus/);
  });

  // null-score axis keeps the no-signal state on its row
  test("no-signal axis shows geen signaal on the row", async ({ page }) => {
    await page.goto("/land-life-company/");

    // power has a null score → "?" glyph in the pentagon
    await expect(page.locator('svg text:text-is("?")')).toBeVisible();
    // and the no-signal meter (not a focus level) in the row's level slot
    const slot = page.locator('[data-axis-level="power"]');
    await expect(slot).toHaveAttribute("data-level", "none");
    await expect(slot).toHaveAttribute("aria-label", "geen signaal");
  });

  // the evidence level lives inside the expanded panel, not on the collapsed row
  test("expanded row shows evidence inside the panel", async ({ page }) => {
    await page.goto("/land-life-company/");
    await waitForHydration(page);

    // the evidence label lives in the axis panel, not inside the row button
    await expect(page.locator('button[data-axis="ecology"] [data-axis-evidence]')).toHaveCount(0);
    await expect(page.locator('.axis-panel [data-axis-evidence="ecology"]')).toHaveCount(1);

    await page.locator('button[data-axis="ecology"]').click();
    const evidence = page.locator('[data-axis-evidence="ecology"]');
    await expect(evidence).toBeVisible();
    await expect(evidence).not.toHaveText("");
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

  test("favorite control reflects state and toggles without navigation", async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, JSON.stringify({ companyIds: ["land-life-company"] }));
      },
      { key: FAVORITES_STORAGE_KEY }
    );
    await page.goto("/land-life-company/");
    await waitForHydration(page);

    const remove = page.locator('button[aria-label="verwijder favoriet"]');
    await expect(remove).toHaveAttribute("aria-pressed", "true");
    await remove.click();
    await expect(page).toHaveURL(/\/land-life-company\/$/);
    await expect(page.locator('button[aria-label="voeg bladwijzer toe"]')).toHaveAttribute("aria-pressed", "false");
    await expect
      .poll(async () =>
        page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}").companyIds, FAVORITES_STORAGE_KEY)
      )
      .toEqual([]);

    await page.locator('button[aria-label="voeg bladwijzer toe"]').click();
    await expect(page.locator('button[aria-label="verwijder favoriet"]')).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(async () =>
        page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}").companyIds, FAVORITES_STORAGE_KEY)
      )
      .toEqual(["land-life-company"]);
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
