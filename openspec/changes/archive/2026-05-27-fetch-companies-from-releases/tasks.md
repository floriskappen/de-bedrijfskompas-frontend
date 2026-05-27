## 1. Remove committed data

- [x] 1.1 Delete `src/data/companies.json` from the working tree
- [x] 1.2 Add `src/data/companies.json` to `.gitignore`

## 2. Fetch script

- [x] 2.1 Create `scripts/fetch-companies.mjs` with two auth paths: `gh release download` (preferred) and a REST fallback using `GH_TOKEN` / `GITHUB_TOKEN`
- [x] 2.2 Resolve "latest release" via the GitHub latest-release endpoint (REST path) or `gh release download` without `--tag` (gh path), targeting repo `floriskappen/de-bedrijfskompas-pipeline`
- [x] 2.3 Download `companies.json` asset and write atomically to `src/data/companies.json` (write to tmp file, validate, then rename)
- [x] 2.4 Validate: file is non-empty and `JSON.parse`s cleanly; on failure, delete the tmp file and exit non-zero with the release tag in the message
- [x] 2.5 Add `--force` flag and a `--skip-if-exists` flag so the same script serves both build (always fetch) and dev (skip if cached) modes
- [x] 2.6 Print actionable error when no auth source is available, naming both `gh auth login` and the `GH_TOKEN` env var

## 3. Wire into npm scripts

- [x] 3.1 Update `package.json`: `"build": "node scripts/fetch-companies.mjs && astro build"`
- [x] 3.2 Update `package.json`: `"dev": "node scripts/fetch-companies.mjs --skip-if-exists && astro dev"` (and same for `start`)
- [x] 3.3 Add `"fetch:data": "node scripts/fetch-companies.mjs --force"` for explicit refresh

## 4. Tests

- [x] 4.1 Unit test `fetchCompanies` against a stubbed `gh` runner (covers spec scenario: "Production build fetches before astro build")
- [x] 4.2 Unit test the REST fallback against a mocked fetch with a fake `GH_TOKEN` (covers "Netlify build with GH_TOKEN")
- [x] 4.3 Unit test the "no auth available" exit path (covers "No usable auth available")
- [x] 4.4 Unit test the validation path with an empty file and a malformed JSON file (covers "Empty or malformed asset")
- [x] 4.5 Unit test the cache-skip behaviour when `--skip-if-exists` is passed and the file is present (covers "Dev with cached data skips network")
- [x] 4.6 Unit test that `--force` triggers a fetch even when the file exists (covers "Forced refresh")
- [x] 4.7 Verify `.gitignore` excludes `src/data/companies.json` (covers "Fresh checkout has no committed data") — a one-line test that reads `.gitignore` is sufficient

## 5. Docs

- [x] 5.1 README: add a "Build prerequisites" section explaining `gh auth login` for local devs and the `GH_TOKEN` env var for Netlify
- [x] 5.2 README: document `npm run fetch:data` as the way to refresh the cached snapshot

## 6. Manual verification

- [x] 6.1 Run `npm run build` locally with `gh` authenticated; confirm fresh `companies.json` is fetched and `astro build` succeeds
- [x] 6.2 Run `npm run dev` twice; confirm the second run does not refetch
- [x] 6.3 Simulate the Netlify path locally: `unset` `gh` from PATH (or run in a clean shell), export `GH_TOKEN`, run `npm run build` — confirm REST fallback works
- [x] 6.4 Confirm the dev server still renders the map with fetched data
