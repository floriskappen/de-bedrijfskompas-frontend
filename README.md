# de bedrijfskompas

een rustige manier om bedrijven te ontdekken — geen vacaturebord, maar een lijst.

## development

### environment variables
to run the application locally, you need a mapbox public access token.
copy `.env.example` to `.env` and set the variable:
```bash
cp .env.example .env
```
and configure `MAPBOX_PUBLIC_TOKEN` in `.env`.

### commands
- `npm run dev`: start the local development server
- `npm run build`: build for production
- `npm run preview`: preview the production build locally
- `npm run test`: run vitest unit tests
- `npm run test:e2e`: run playwright e2e tests
