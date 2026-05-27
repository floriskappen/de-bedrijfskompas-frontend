import { test, expect } from "@playwright/test";

test.describe("map-overview E2E tests", () => {
  
  test.beforeEach(({ page }) => {
    // Print page console logs to terminal
    page.on("console", (msg) => {
      console.log(`[browser console] ${msg.type()}: ${msg.text()}`);
    });
  });

  const setZoom = async (page: any, zoomVal: number) => {
    await page.waitForFunction(() => typeof (window as any).setTestZoom === "function");
    await page.evaluate((z) => (window as any).setTestZoom(z), zoomVal);
  };

  const setCenterAndZoom = async (page: any, lng: number, lat: number, zoomVal: number) => {
    await page.waitForFunction(() => typeof (window as any).setTestCenterAndZoom === "function");
    await page.evaluate(
      ({ lng, lat, z }) => (window as any).setTestCenterAndZoom(lng, lat, z),
      { lng, lat, z: zoomVal }
    );
  };

  // 13.1 dutch route at root
  test("dutch route at root", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("de bedrijfskompas");
    const switcher = page.locator("#language-switcher");
    await expect(switcher).toHaveText("english");
  });

  // 13.2 english route under /en/
  test("english route under /en/", async ({ page }) => {
    await page.goto("/en/");
    await expect(page).toHaveTitle("de bedrijfskompas");
    const switcher = page.locator("#language-switcher");
    await expect(switcher).toHaveText("nederlands");
  });

  // 13.3 auto-fit on cold load & 13.5 each renderable company has exactly one pin
  test("each renderable company has exactly one pin", async ({ page }) => {
    await page.goto("/");
    await setZoom(page, 16);
    // We have 13 valid companies in companies.json (after dropping 4 invalid ones)
    const pins = page.locator("[data-company-id]");
    await expect(pins).toHaveCount(13);
  });

  // company with all-null scores still renders a pin and stays tappable
  test("null-score company renders a pin and stays tappable", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 5.38085615, 52.15584731, 16);

    const pinGravity = page.locator("#pin-gravity");
    await expect(pinGravity).toBeVisible();

    await pinGravity.click();
    const heading = page.locator("#peek-card-title");
    await expect(heading).toHaveText("Gravity B.V.");
  });

  // 13.8 selecting a pin updates the URL and opens the peek card
  test("selecting a pin updates the URL and opens the peek card", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 4.92268301, 52.36276833, 16);
    const pin = page.locator("#pin-land-life-company");
    await pin.click();
    
    await expect(page).toHaveURL(/.*selected=land-life-company.*/);
    const heading = page.locator("#peek-card-title");
    await expect(heading).toHaveText("Land Life Company B.V.");
  });

  // 13.9 deep-link opens peek card on first paint
  test("deep-link opens peek card on first paint", async ({ page }) => {
    await page.goto("/?selected=gravity");
    const heading = page.locator("#peek-card-title");
    await expect(heading).toHaveText("Gravity B.V.");
  });

  // 13.10 unknown selection is ignored
  test("unknown selection is ignored", async ({ page }) => {
    await page.goto("/?selected=unknown-company");
    await expect(page).not.toHaveURL(/.*selected=.*/);
    const peekCard = page.locator("#peek-card-title");
    await expect(peekCard).toHaveCount(0);
  });

  // 13.11 clearing selection (covers tap-selected-pin, tap-map-background, and Escape)
  test("clearing selection", async ({ page }) => {
    // 1. Test Escape key
    await page.goto("/?selected=land-life-company");
    await setCenterAndZoom(page, 4.92268301, 52.36276833, 16);
    
    // Wait for PeekCard to render (meaning hydration completed)
    const title = page.locator("#peek-card-title");
    await expect(title).toBeVisible();

    await page.evaluate(() => {
      window.focus();
      document.body.focus();
    });
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/.*selected=.*/);
    await expect(title).toHaveCount(0);

    // 2. Test tap selected pin again
    await page.locator("#pin-land-life-company").click();
    await expect(page).toHaveURL(/.*selected=land-life-company.*/);
    await page.locator("#pin-land-life-company").click();
    await expect(page).not.toHaveURL(/.*selected=.*/);
    await expect(title).toHaveCount(0);

    // 3. Test tap map background
    await page.locator("#pin-land-life-company").click();
    await expect(page).toHaveURL(/.*selected=land-life-company.*/);
    await page.locator("#map-view").click({ position: { x: 5, y: 5 } });
    await expect(page).not.toHaveURL(/.*selected=.*/);
    await expect(title).toHaveCount(0);
  });

  // 13.12 peek card renders current-locale prose
  test("peek card renders current-locale prose", async ({ page }) => {
    // Dutch
    await page.goto("/?selected=land-life-company");
    await expect(page.locator("text=een winstgerichte onderneming die door bedrijven wordt ingehuurd om grootschalige bossen aan te planten die koolstof uit de lucht verwijderen.")).toBeVisible();

    // English
    await page.goto("/en/?selected=land-life-company");
    await expect(page.locator("text=a for-profit company that is hired by businesses to plant large-scale forests that remove carbon from the air.")).toBeVisible();
  });

  // 13.13 pentagon renders all five axes including nulls
  test("pentagon renders all five axes including nulls", async ({ page }) => {
    await page.goto("/?selected=land-life-company");
    for (const axis of ["SUBSTANCE", "ECOLOGY", "POWER", "EMBEDDEDNESS", "POSTURE"]) {
      await expect(page.locator(`svg text:text-is("${axis}")`)).toBeVisible();
    }
    // null axis (power) renders the "?" glyph at the center of its spoke
    await expect(page.locator('svg text:text-is("?")')).toBeVisible();
  });

  // 13.14 CTA preserves locale and uses the company slug
  test("CTA preserves locale and uses the company slug", async ({ page }) => {
    await page.goto("/en/?selected=land-life-company");
    const cta = page.locator("text=open full profile");
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/.*\/en\/land-life-company\//);
    await expect(page.locator("h1")).toHaveText("land life company b.v.");
  });

  // 13.15 switcher preserves selection across locales
  test("switcher preserves selection across locales", async ({ page }) => {
    await page.goto("/?selected=land-life-company");
    const switcher = page.locator("#language-switcher");
    await expect(switcher).not.toHaveAttribute("href", "#");
    await switcher.click();
    await expect(page).toHaveURL(/.*\/en\/\?selected=land-life-company.*/);
    await expect(page.locator("#peek-card-title")).toHaveText("Land Life Company B.V.");
  });

  // 13.16 switcher toggles back to default
  test("switcher toggles back to default", async ({ page }) => {
    await page.goto("/en/");
    const switcher = page.locator("#language-switcher");
    await expect(switcher).not.toHaveAttribute("href", "#");
    await switcher.click();
    await expect(page).toHaveURL(/\/$/);
  });

  // 13.17 empty collection still renders the map
  test("empty collection still renders the map", async ({ page }) => {
    await page.goto("/test-empty");
    const overlay = page.locator("#empty-state-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveText("geen bedrijven in beeld");
  });

  // New Geolocation test: User geolocation shows location marker and centers map
  test("user geolocation shows location marker and centers map", async ({ context, page }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 52.37, longitude: 4.89 });
    await page.goto("/");
    
    const geolocateBtn = page.locator("#geolocate-button");
    await expect(geolocateBtn).toBeVisible();
    await geolocateBtn.click();
    
    const userMarker = page.locator("#user-location-marker");
    await expect(userMarker).toBeVisible();
  });

  // New Geolocation test: Selected company displays distance from user
  test("selected company displays distance from user", async ({ context, page }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 52.37, longitude: 4.89 });
    await page.goto("/");
    await setCenterAndZoom(page, 4.92268301, 52.36276833, 16);
    
    // Make user location active
    await page.locator("#geolocate-button").click();
    
    // Open land-life-company peek card
    await page.locator("#pin-land-life-company").click();
    
    // distance is appended to the locality line under the company title
    await expect(page.locator("#peek-card-title").locator("..").locator("p")).toContainText("km");
  });

  // Scenario: Dynamic clustering based on zoom
  test("dynamic clustering based on zoom", async ({ page }) => {
    await page.goto("/");
    await setZoom(page, 10);
    await page.waitForTimeout(500);
    
    // At zoom 10, some pins should be clustered.
    // Check if cluster elements are visible
    const clusters = page.locator('[id^="cluster-"]');
    await expect(clusters.first()).toBeVisible();

    const pinsCount = await page.locator("[data-company-id]").count();
    const clusterLocators = await clusters.all();
    let clusterPointsCount = 0;
    for (const cl of clusterLocators) {
      const text = await cl.textContent();
      clusterPointsCount += parseInt(text || "0", 10);
    }
    expect(pinsCount + clusterPointsCount).toBe(13);
  });

  // Scenario: Clicking a cluster zooms in
  test("clicking a cluster zooms in", async ({ page }) => {
    await page.goto("/");
    await setZoom(page, 10);
    await page.waitForTimeout(500);

    const clusters = page.locator('[id^="cluster-"]');
    await expect(clusters.first()).toBeVisible();

    const pinsCountBefore = await page.locator("[data-company-id]").count();
    
    // Click the first cluster to zoom in
    await clusters.first().dispatchEvent('click');

    // The zoom level increases, expanding clusters and revealing more individual pins
    await expect.poll(async () => {
      return await page.locator("[data-company-id]").count();
    }).toBeGreaterThan(pinsCountBefore);
  });
});
