// Plays the paper-bloom "conceal" curtain from a given screen origin, then
// navigates. Used when leaving a page (peek card → detail, detail → map) so the
// bloom appears to grow out of the thing you tapped before the next page's own
// reveal takes over. Under reduced motion it just navigates.

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function concealThenNavigate(href: string, originX: number, originY: number): void {
  if (prefersReducedMotion()) {
    window.location.href = href;
    return;
  }

  // guard against double-firing (animationend + fallback timeout)
  let navigated = false;
  const go = () => {
    if (navigated) return;
    navigated = true;
    window.location.href = href;
  };

  const curtain = document.createElement("div");
  curtain.className = "bloom-curtain is-concealing";
  curtain.style.setProperty("--ox", `${Math.round(originX)}px`);
  curtain.style.setProperty("--oy", `${Math.round(originY)}px`);
  curtain.addEventListener("animationend", go, { once: true });
  document.body.appendChild(curtain);

  // fallback in case animationend never fires (pseudo-element quirks)
  window.setTimeout(go, 560);
}
