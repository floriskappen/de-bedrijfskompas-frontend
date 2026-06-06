// Formats an ISO 8601 timestamp as a localized relative time ("12 dagen
// geleden" / "12 days ago") for the detail page's last-checked footer.
// `Intl.RelativeTimeFormat` is locale-aware and lowercase for nl/en, so no
// date library and no stored copy for the phrase itself.

// Coarsening ladder: each step's `amount` is how many of the current unit make
// up the next one. The first unit whose span the diff fits within is used, so a
// diff reads in the largest sensible unit (minutes, not 3600 seconds).
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 30, unit: "day" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatLastChecked(
  isoTimestamp: string | undefined | null,
  locale: string,
  now: Date = new Date(),
): string | null {
  if (!isoTimestamp) return null;
  const then = new Date(isoTimestamp);
  if (Number.isNaN(then.getTime())) return null;

  const currentLocale = locale === "en" ? "en" : "nl";
  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: "auto" });

  // Past timestamps yield a negative value (e.g. -12 days). Start in minutes;
  // a sub-minute diff floors to 0 ("nu" / "now") rather than going negative.
  let value = Math.round((then.getTime() - now.getTime()) / 60000);
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(value) < amount) {
      return rtf.format(value, unit);
    }
    value = Math.round(value / amount);
  }
  return null;
}
