import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https://api.mapbox.com https://*.mapbox.com",
  "font-src 'self' https://*.mapbox.com",
  "connect-src 'self' https://openrouter.ai https://api.mapbox.com https://*.mapbox.com",
];

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  i18n: {
    defaultLocale: "nl",
    locales: ["nl", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    csp: {
      algorithm: "SHA-256",
      directives: cspDirectives,
      scriptDirective: {
        resources: ["'self'"],
        hashes: ["sha256-8DoqH/d1Fj7lVXopIQ7FW/qg6tRlIGoTpYYixLwFtNA="],
      },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
