import { test, expect } from "@playwright/test";
import { DOMAIN_ICON_PATHS } from "../src/lib/company-data/domain-icons";

test.describe("map-overview E2E tests", () => {
  
  test.beforeEach(({ page }) => {
    // Print page console logs to terminal
    page.on("console", (msg) => {
      console.log(`[browser console] ${msg.type()}: ${msg.text()}`);
    });
  });

  const setZoom = async (page: any, zoomVal: number) => {
    await page.waitForFunction(() => typeof (window as any).setTestZoom === "function");
    await page.evaluate((z: number) => (window as any).setTestZoom(z), zoomVal);
  };

  const setCenterAndZoom = async (page: any, lng: number, lat: number, zoomVal: number) => {
    await page.waitForFunction(() => typeof (window as any).setTestCenterAndZoom === "function");
    await page.evaluate(
      ({ lng, lat, z }: { lng: number; lat: number; z: number }) => (window as any).setTestCenterAndZoom(lng, lat, z),
      { lng, lat, z: zoomVal }
    );
  };

  const setTestFilters = async (page: any, filters: any) => {
    await page.waitForFunction(() => typeof (window as any).setTestFilters === "function");
    await page.evaluate((nextFilters: any) => (window as any).setTestFilters(nextFilters), filters);
  };

  const getRevealState = async (page: any) => {
    return page.locator("#map-reveal-surface").evaluate((el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      const coverStyle = window.getComputedStyle(el, "::before");
      const bloomStyle = window.getComputedStyle(el, "::after");
      const rect = el.getBoundingClientRect();

      return {
        animationName: style.animationName,
        transform: style.transform,
        coverAnimationName: coverStyle.animationName,
        coverAnimationTimingFunction: coverStyle.animationTimingFunction,
        coverPointerEvents: coverStyle.pointerEvents,
        coverContent: coverStyle.content,
        bloomAnimationName: bloomStyle.animationName,
        bloomPointerEvents: bloomStyle.pointerEvents,
        bloomContent: bloomStyle.content,
        rect: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };
    });
  };

  // 13.1 dutch route at root
  test("dutch route at root", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("de bedrijfskompas");
    await expect(page.locator("#filters-button")).toBeVisible();
    await expect(page.locator("#language-switcher")).toHaveCount(0);
  });

  // 13.2 english route under /en/
  test("english route under /en/", async ({ page }) => {
    await page.goto("/en/");
    await expect(page).toHaveTitle("de bedrijfskompas");
    await expect(page.locator("#filters-button")).toBeVisible();
    await expect(page.locator("#language-switcher")).toHaveCount(0);
  });

  // Scenario: First load reveals from paper
  test("initial map reveal starts from paper cover", async ({ page }) => {
    for (const route of ["/", "/en/"]) {
      await page.goto(route);

      const surface = page.locator("#map-reveal-surface");
      await expect(surface).toBeVisible();

      const revealState = await getRevealState(page);
      const viewport = page.viewportSize();
      expect(revealState.animationName).toBe("none");
      expect(revealState.transform).toBe("none");
      expect(revealState.coverAnimationName).toBe("map-paper-cover-release");
      expect(revealState.coverAnimationTimingFunction).toContain("steps");
      expect(revealState.coverPointerEvents).toBe("none");
      expect(revealState.bloomAnimationName).toBe("map-reveal-bloom");
      expect(revealState.bloomPointerEvents).toBe("none");

      await page.waitForTimeout(400);
      const settledState = await getRevealState(page);
      expect(settledState.rect.width).toBe(viewport?.width);
      expect(settledState.rect.height).toBe(viewport?.height);
    }
  });

  // Scenario: Reduced motion skips the reveal
  test("reduced motion skips initial map reveal", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const revealState = await getRevealState(page);
    const viewport = page.viewportSize();

    expect(revealState.animationName).toBe("none");
    expect(revealState.transform).toBe("none");
    expect(revealState.coverContent).toBe("none");
    expect(revealState.bloomContent).toBe("none");
    expect(revealState.rect.width).toBe(viewport?.width);
    expect(revealState.rect.height).toBe(viewport?.height);
  });

  // 13.3 auto-fit on cold load & 13.5 each renderable company has exactly one pin
  test("every matching renderable company has one badge pin", async ({ page }) => {
    await page.goto("/");
    await setZoom(page, 16);
    // We have 13 valid companies in companies.json (after dropping 4 invalid ones)
    const pins = page.locator("[data-company-id]");
    await expect(pins).toHaveCount(13);
    await expect(pins.first().locator("[data-score-badge]")).toBeVisible();
  });

  // company with all-null scores still renders a pin and stays tappable
  test("null-score company is still tappable", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 5.38085615, 52.15584731, 16);

    const pinGravity = page.locator("#pin-gravity");
    await expect(pinGravity).toBeVisible();

    await pinGravity.click();
    const heading = page.locator("#peek-card-title");
    await expect(heading).toHaveText("Gravity B.V.");
  });

  test("collocated score badges fan out", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 5.38085615, 52.15584731, 16);

    const gravityBox = await page.locator("#pin-gravity").boundingBox();
    const amuletBox = await page.locator("#pin-amulet").boundingBox();

    expect(gravityBox).not.toBeNull();
    expect(amuletBox).not.toBeNull();
    expect(`${Math.round(gravityBox!.x)},${Math.round(gravityBox!.y)}`).not.toBe(
      `${Math.round(amuletBox!.x)},${Math.round(amuletBox!.y)}`
    );
  });

  test("selected score badge stays pressed down without a halo", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 4.92268301, 52.36276833, 16);

    await expect(page.locator("#pin-land-life-company .pin-inner")).toHaveClass(/is-score-/);
    await page.locator("#pin-land-life-company").click();

    const selectedBadge = page.locator("#pin-land-life-company .pin-inner");
    await expect(selectedBadge).toHaveClass(/is-selected/);
    const selectedStyle = await selectedBadge.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderBottomWidth: style.borderBottomWidth,
        boxShadow: style.boxShadow,
        color: style.color,
        transform: style.transform,
      };
    });
    // the selected pin inverts to ink so it reads as chosen on the paper field
    // (wine theme: ink #2a1718, paper text #f2e7e7)
    expect(selectedStyle.backgroundColor).toBe("rgb(42, 23, 24)");
    expect(selectedStyle.borderBottomWidth).toBe("1px");
    expect(selectedStyle.boxShadow).toBe("none");
    expect(selectedStyle.color).toBe("rgb(242, 231, 231)");
    expect(selectedStyle.transform).not.toBe("none");
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

  // Scenario: Deep-link state survives the reveal
  test("deep-link opens peek card through initial reveal", async ({ page }) => {
    await page.goto("/?selected=gravity");
    await expect(page.locator("#map-reveal-surface")).toBeVisible();
    const revealState = await getRevealState(page);
    expect(revealState.transform).toBe("none");
    expect(revealState.coverAnimationName).toBe("map-paper-cover-release");

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
    for (const axis of ["INHOUD", "ECOLOGIE", "MACHT", "VERANKERING", "HOUDING"]) {
      await expect(page.locator(`svg text:text-is("${axis}")`)).toBeVisible();
    }
    // null axis (power) renders the "?" glyph at the center of its spoke
    await expect(page.locator('svg text:text-is("?")')).toBeVisible();
  });

  // 13.14 activating the card preserves locale and uses the company slug
  test("activating the card preserves locale and uses the company slug", async ({ page }) => {
    await page.goto("/en/?selected=land-life-company");
    const card = page.locator("#peek-card");
    await expect(card).toHaveAttribute("role", "button");
    // the whole card is the affordance — tap the body (away from the action buttons) to open
    await page.locator("#peek-card-title").click();
    await expect(page).toHaveURL(/.*\/en\/land-life-company\//);
    await expect(page.locator("h1")).toHaveText("land life company b.v.");
  });

  test("peek card action buttons share the same height", async ({ page }) => {
    await page.goto("/?selected=land-life-company");

    const peekCardBackground = await page.locator("#peek-card").evaluate((el) => getComputedStyle(el).backgroundColor);
    // shared warm overlay surface used by the filter panel header
    expect(peekCardBackground).toBe("rgb(246, 240, 240)");

    const bookmark = page.locator('#peek-card button[aria-label="voeg bladwijzer toe"]');
    const close = page.locator('#peek-card button[aria-label="sluiten"]');
    await expect(bookmark).toBeVisible();
    await expect(close).toBeVisible();

    const [bookmarkBox, closeBox] = await Promise.all([bookmark.boundingBox(), close.boundingBox()]);
    expect(bookmarkBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(Math.round(bookmarkBox!.height)).toBe(Math.round(closeBox!.height));
  });

  test("close button clears the selection without navigating", async ({ page }) => {
    await page.goto("/?selected=land-life-company");
    await expect(page.locator("#peek-card-title")).toBeVisible();
    await page.locator('#peek-card button[aria-label="sluiten"]').click();
    await expect(page.locator("#peek-card-title")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test("map chrome omits language switcher while routes stay localized", async ({ page }) => {
    await page.goto("/?selected=land-life-company");
    await expect(page.locator("#language-switcher")).toHaveCount(0);
    await expect(page.locator("text=een winstgerichte onderneming die door bedrijven wordt ingehuurd om grootschalige bossen aan te planten die koolstof uit de lucht verwijderen.")).toBeVisible();

    await page.goto("/en/?selected=land-life-company");
    await expect(page.locator("#language-switcher")).toHaveCount(0);
    await expect(page.locator("text=a for-profit company that is hired by businesses to plant large-scale forests that remove carbon from the air.")).toBeVisible();
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
  test("dynamic clustering counts matching companies", async ({ page }) => {
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
  test("clicking filtered cluster zooms in", async ({ page }) => {
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

  test("filtering clears hidden selection", async ({ page }) => {
    await page.goto("/?selected=gravity");
    await expect(page.locator("#peek-card-title")).toHaveText("Gravity B.V.");

    await setTestFilters(page, { axisMinimums: { power: 5 } });

    await expect(page).not.toHaveURL(/.*selected=.*/);
    await expect(page.locator("#peek-card-title")).toHaveCount(0);
  });

  test("icon-only filter button opens panel", async ({ page }) => {
    await page.goto("/");

    const button = page.locator("#filters-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("");
    await button.click();

    await expect(page.locator("#filters-panel")).toBeVisible();
    await expect(page).not.toHaveURL(/.*filters/);
  });

  test("reset clears active filters", async ({ page }) => {
    await page.goto("/");
    await setTestFilters(page, { axisMinimums: { power: 5 }, selectedDomains: ["sales-commercial"] });
    await expect(page.locator("#filters-active-count")).toHaveText("2");
    await expect(page.locator("#filters-active-count")).toHaveClass(/filter-count-badge/);

    await page.locator("#filters-button").click();

    await expect(page.locator('[data-domain-filter="sales-commercial"]')).toHaveAttribute("aria-pressed", "true");
    const activeTagStyle = await page.locator('[data-domain-filter="sales-commercial"]').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        borderBottomWidth: style.borderBottomWidth,
        transform: style.transform,
      };
    });
    expect(activeTagStyle.borderBottomWidth).toBe("1px");
    expect(activeTagStyle.transform).not.toBe("none");
    await page.locator("#filters-reset").click();

    await expect(page.locator('input[aria-label="macht minimum"]')).toHaveValue("0");
    await expect(page.locator('[data-domain-filter="sales-commercial"]')).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#filters-active-count")).toHaveCount(0);
  });

  test("reduced motion skips panel animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("#filters-button").click();

    const animationName = await page.locator("#filters-panel").evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe("none");
  });

  test("histogram includes unknown bucket", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    await expect(page.locator('[data-axis="power"][data-bucket="unknown"]')).toBeVisible();
  });

  test("histogram buckets aggregate by tens", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    await expect(page.locator('[data-axis="ecology"][data-bucket="50"]')).toBeVisible();
    await expect(page.locator('[data-axis="ecology"][data-bucket="60"]')).toBeVisible();
    await expect(page.locator('[data-axis="ecology"][data-bucket="70"]')).toBeVisible();
  });

  test("bucket threshold aligns with visible bucket labels", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    await page.locator('input[aria-label="ecologie minimum"]').fill("50");

    await expect(page.locator('input[aria-label="ecologie minimum"]')).toHaveValue("50");
    await expect(page.locator('[data-axis-filter="ecology"]')).toContainText("min 50");
  });

  test("histogram bars do not grow when filtering removes companies", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    const bucket = page.locator('[data-axis="ecology"][data-bucket="60"] > div').first();
    const before = await bucket.evaluate((el) => el.getBoundingClientRect().height);
    await setTestFilters(page, { axisMinimums: { substance: 70 } });
    const after = await bucket.evaluate((el) => el.getBoundingClientRect().height);

    expect(after).toBeLessThanOrEqual(before);
  });

  test("work-field counts update with active filters", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    // data carries capability tags, so chips render rather than the empty state
    await expect(page.locator("#domains-empty-state")).toHaveCount(0);
    const sales = page.locator('[data-domain-filter="sales-commercial"]');
    await expect(sales).toBeVisible();
    await expect(sales.locator("svg path")).toHaveAttribute("d", DOMAIN_ICON_PATHS["sales-commercial"]);

    await setTestFilters(page, { selectedDomains: ["sales-commercial"] });
    await expect(sales).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#filters-active-count")).toHaveText("1");
  });

  test("no work-field data shows empty work-field section", async ({ page }) => {
    await page.goto("/test-no-tags");
    await page.locator("#filters-button").click();

    await expect(page.locator("#domains-empty-state")).toHaveText("nog geen werkvelden in de huidige data");
    await expect(page.locator("[data-domain-filter]")).toHaveCount(0);
  });

  test("filter panel layers above an open peek card", async ({ page }) => {
    await page.goto("/?selected=2daysmood");
    await page.waitForSelector("#peek-card");
    await page.locator("#filters-button").click();

    const panel = page.locator("#filters-panel");
    await expect(panel).toBeVisible();
    await panel.evaluate((el) => {
      const animations = el.getAnimations();
      return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    });
    // the panel must paint above the peek card, not behind it
    const panelOnTop = await page.evaluate(() => {
      const reset = document.getElementById("filters-reset");
      if (!reset) return false;
      const r = reset.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + 8);
      return el === reset || reset.contains(el);
    });
    expect(panelOnTop).toBe(true);
  });

  test("filter panel header stays reachable while scrolling", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    const panel = page.locator("#filters-panel");
    await panel.evaluate((el) => el.scrollTo(0, el.scrollHeight));

    // reset/close controls remain on top of the scrolled content
    const closeReachable = await page.evaluate(() => {
      const reset = document.getElementById("filters-reset");
      if (!reset) return false;
      const r = reset.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el === reset || (!!el && reset.contains(el));
    });
    expect(closeReachable).toBe(true);
  });

  test("map ui uses pinned ontwerp values", async ({ page }) => {
    for (const route of ["/", "/en/"]) {
      await page.goto(route);
      const tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return {
          page: root.getPropertyValue("--color-surface-page").trim(),
          ink: root.getPropertyValue("--color-text-default").trim(),
          accent: root.getPropertyValue("--color-accent-base").trim(),
        };
      });
      expect(tokens.page).toBeTruthy();
      expect(tokens.ink).toBeTruthy();
      expect(tokens.accent).toBeTruthy();

      const filtersButton = page.locator("#filters-button");
      await expect(filtersButton).toHaveClass(/ontwerp-icon-button/);
      await expect(filtersButton).toBeVisible();

      const buttonStyle = await filtersButton.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          borderRadius: style.borderRadius,
          borderColor: style.borderColor,
          position: style.position,
          transitionDuration: style.transitionDuration,
        };
      });
      expect(buttonStyle.borderRadius).toBe("0px");
      expect(buttonStyle.borderColor).not.toBe("rgb(59, 130, 246)");
      expect(buttonStyle.position).toBe("absolute");
      expect(buttonStyle.transitionDuration).toBe("0s");

      const geolocatePosition = await page.locator("#geolocate-button").evaluate((el) => getComputedStyle(el).position);
      expect(geolocatePosition).toBe("absolute");

      await setTestFilters(page, { axisMinimums: { power: 5 } });
      const countStyle = await page.locator("#filters-active-count").evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          height: style.height,
          position: style.position,
        };
      });
      // accent fill + paper ring so the count reads clearly against the button
      // (wine theme: accent #8e3a3f, paper text #f2e7e7)
      expect(countStyle.backgroundColor).toBe("rgb(142, 58, 63)");
      expect(countStyle.color).toBe("rgb(242, 231, 231)");
      expect(countStyle.height).toBe("19px");
      expect(countStyle.position).toBe("absolute");

      await filtersButton.click();
      await expect(page.locator("#filters-panel")).toHaveClass(/ontwerp-sheet/);
      await expect(page.locator("#filters-reset")).toHaveClass(/ontwerp-button/);
    }
  });

  test("map behavior survives ontwerp reskin", async ({ page }) => {
    await page.goto("/");
    await setCenterAndZoom(page, 4.92268301, 52.36276833, 16);

    await page.locator("#pin-land-life-company").click();
    await expect(page).toHaveURL(/.*selected=land-life-company.*/);
    await expect(page.locator("#peek-card-title")).toHaveText("Land Life Company B.V.");
    await expect(page.locator("#pin-land-life-company .pin-inner")).toHaveClass(/score-badge/);
    await expect(page.locator("#pin-land-life-company .pin-inner")).toHaveClass(/is-selected/);

    await page.locator("#filters-button").click();
    await expect(page.locator("#filters-panel")).toBeVisible();
    await setTestFilters(page, { axisMinimums: { power: 5 } });
    await expect(page).not.toHaveURL(/.*selected=.*/);
    await expect(page.locator("#peek-card-title")).toHaveCount(0);
  });

  test("map interactions use stepped or immediate motion", async ({ page }) => {
    await page.goto("/");
    await page.locator("#filters-button").click();

    const panelTiming = await page.locator("#filters-panel").evaluate((el) => getComputedStyle(el).animationTimingFunction);
    expect(panelTiming).toContain("steps");

    const buttonTransition = await page.locator("#filters-button").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(buttonTransition).toBe("0s");

    await page.goto("/?selected=gravity");
    const cardTiming = await page.locator("#peek-card").evaluate((el) => getComputedStyle(el).animationTimingFunction);
    expect(cardTiming).toContain("steps");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("#filters-button").click();
    const reducedPanelAnimation = await page.locator("#filters-panel").evaluate((el) => getComputedStyle(el).animationName);
    expect(reducedPanelAnimation).toBe("none");
  });
});
