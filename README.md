# de bedrijfskompas

een rustige manier om bedrijven te ontdekken

## development

### environment variables
to run the application locally, you need a mapbox public access token.
copy `.env.example` to `.env` and set the variable:
```bash
cp .env.example .env
```
and configure `MAPBOX_PUBLIC_TOKEN` in `.env`.

### build prerequisites
company data is fetched from the latest release of the private pipeline repo `floriskappen/de-bedrijfskompas-pipeline` at build time. you need one of:

- **locally**: the [github cli](https://cli.github.com/) (`gh`) installed and signed in with an account that has read access to the pipeline repo:
  ```bash
  gh auth login
  ```
- **on netlify / ci**: a personal access token with read access to the pipeline repo, set as the `GH_TOKEN` build env var (`GITHUB_TOKEN` also works as a fallback).

the fetched file lands at `src/data/companies.json` and is gitignored. `dev` reuses the cached file if present; `build` always refetches. run `npm run fetch:data` to force a refresh.

### commands
- `npm run dev`: start the local development server (uses cached data if present)
- `npm run build`: build for production (always refetches data)
- `npm run preview`: preview the production build locally
- `npm run fetch:data`: refresh the cached `companies.json` from the latest pipeline release
- `npm run test`: run vitest unit tests
- `npm run test:e2e`: run playwright e2e tests
