## Context

The BYOK layer (`src/lib/byok/`) predates the BYOM constitution and meets invariants 1, 2, 5 and the data-egress rule, but three load-bearing gaps remain (see `BYOM-INTEGRATION.md`): no CSP (inv 3), an unaudited JS surface (inv 4), and a 401 that returns `invalid_key` without clearing the stale key (`03` "When a request fails"). The app is a static Astro build (no SSR adapter); interactive parts (map, filters, BYOK/Ikigai dialogs) ship as React islands. The only provider is OpenRouter (`byok/openrouter.ts` → `https://openrouter.ai`). The map is Mapbox GL 3.x.

## Goals / Non-Goals

**Goals:**
- A strict, host-agnostic CSP that stops key/prompt exfiltration via injected scripts (the load-bearing intent of inv 3).
- A stale key is never re-armed after a 401; the user is prompted to re-connect.
- The third-party JS surface is audited and justified in `BYOM-INTEGRATION.md`.

**Non-Goals:**
- First-time-key-holder onboarding, OpenRouter link, provider spend-limit prompt — that is change F.
- Removing or replacing Mapbox; it is the product. Its CSP cost is recorded, not eliminated.
- A real HTTP-header CSP (requires an SSR adapter); the meta-tag form is the host-agnostic ceiling for a static build.
- Pre-flight budget estimation (inv 6) — that is change D.

## Decisions

### D1 — CSP via Astro `experimental.csp`, emitted as a meta tag
Astro's `experimental.csp` auto-hashes bundled inline scripts and styles and writes a `<meta http-equiv="content-security-policy">` into the document head (`runtime/server/render/head.js`). For static output (no adapter) the destination is `meta`, so the policy ships inside the HTML and is enforced by any static host — Netlify, Vercel, Cloudflare Pages, GitHub Pages — with zero host-specific config. The decisive benefit over a `public/_headers` file: Astro islands inject inline hydration scripts, so a static header would force `script-src 'unsafe-inline'`, gutting inv 3. With `experimental.csp`, `script-src` stays `'self'` plus per-script hashes (no `'unsafe-inline'`). Alternatives considered: `public/_headers` (Netlify/Cloudflare convention, host-lock-in, forces `'unsafe-inline'` for scripts — rejected); an Astro adapter with `experimentalStaticHeaders` (requires SSR, not this app's shape). The trade-off is that `experimental.csp` is an experimental flag; see Risks.

### D2 — Mapbox concessions, recorded and justified; no `'unsafe-eval'`, no wildcards
Mapbox GL spawns WebGL workers from `blob:` URLs and injects runtime styles. The policy accommodates these narrowly: `worker-src 'self' blob:`, `style-src 'self'` plus Astro's style hashes (and `'unsafe-hashes'` only if a Mapbox-injected style resists hashing), `img-src 'self' data: blob: https://api.mapbox.com https://*.mapbox.com`, `font-src 'self' https://*.mapbox.com`. The key-protection value of CSP lives in `script-src` (no `'unsafe-inline'`/`'unsafe-eval'`/`*`) and a closed `connect-src 'self' https://openrouter.ai https://api.mapbox.com https://*.mapbox.com` — neither is conceded. `default-src 'self'` backs everything else; `object-src 'none'`, `base-uri 'self'`. The concessions (blob workers, style injection) do not open a key-exfil channel and are recorded as deviations with reasoning in `BYOM-INTEGRATION.md`. If a Mapbox 3.x build option removes the `blob:`/style-injection need, the directives tighten later.

### D3 — Stale-key clearing clears both session and persisted key; emit, no retry
On `invalid_key` the client clears `sessionApiKey` **and** wipes the persisted `savedKey` (a revoked key must not linger for `confirmSavedByokKey()` to re-arm). A production `clearByokKey()` replaces the test-only `clearByokSessionForTests()` and emits the existing `BYOK_CHANGED_EVENT` so the UI re-reads config. The runner already returns the error up its chain; the Ikigai/Byok surfaces show the localized `byok_error_invalid_key` and, because `hasSavedKey` is now false, the setup sheet naturally lands in the enter-key state on reopen. No silent retry — the client performs exactly one `fetch` (asserted). Alternative considered: clear session only and keep `savedKey` — rejected as unclean: it leaves a known-dead credential one confirmation away from a 401 loop.

### D4 — Third-party JS audit is documentation, not code
After `script-src 'self'`, nothing loads from a CDN at runtime; every dependency is bundled by Vite. The audit enumerates the runtime deps (mapbox-gl, react/react-dom, supercluster, Astro island runtime, Tailwind build-time CSS) with a one-line justification each, recorded in `BYOM-INTEGRATION.md`'s key-handling section. The honest tension — Mapbox GL is the largest attack surface in a key-holding app and it is also the product — is stated plainly.

## Risks / Trade-offs

- [**`experimental.csp` is experimental**] → The flag could change or be removed in an Astro release. Mitigation: the directives live in `astro.config.mjs` as a plain array, trivially portable to a `_headers`/adapter header if the flag disappears; the `byom-consumption` test asserts the built meta tag is present, so a regression fails the build.
- [**Meta-tag CSP is weaker than an HTTP header**] → A meta tag cannot set `frame-ancestors`/`report-uri`/`sandbox` and is parsed after the head begins loading. For this app's threat model (stop key/prompt exfil via injected scripts) the head-meta placement is early enough and `script-src` is the operative directive. Recorded honestly in `BYOM-INTEGRATION.md`.
- [**Mapbox concessions erode "strict"**] → `blob:` workers and style injection are visible widenings. Mitigation: they are the only concessions, they open no exfil channel, and they are justified per-origin; no `'unsafe-eval'` and no wildcard `*`. Likely a `BYOM_STRUGGLES.md` entry: inv 3's "strict" has no observable acceptance signal against a map-heavy app.
- [**Wiping `savedKey` on a transient 401**] → If OpenRouter returns 401 for a non-key reason (rare), the saved key is lost and must be re-entered. Mitigation: 401/403 are auth-failure signals by definition; the constitution (`03`) mandates treating the stored key as stale on auth failure, so this is the specified behaviour, not a regression.
- [**inv 4 "minimal" is unquantified**] → No threshold for "minimal enough." Mitigation: the audit is honest and recorded; the friction is logged for BYOM v1.
