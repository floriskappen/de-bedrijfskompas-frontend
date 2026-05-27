import React, { useEffect, useState } from "react";

interface BottomHintProps {
  text: string;
}

export default function BottomHint({ text }: BottomHintProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("selected")) setHidden(true);

    const onSelection = (e: Event) => {
      const id = (e as CustomEvent).detail?.companyId;
      setHidden(Boolean(id));
    };
    window.addEventListener("selection-changed", onSelection);
    return () => window.removeEventListener("selection-changed", onSelection);
  }, []);

  if (hidden) return null;

  return (
    <div
      id="bottom-hint"
      className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center font-mono text-[11px] tracking-[0.08em] uppercase text-ink-soft"
      style={{ textShadow: "0 0 8px rgba(241,236,224,0.9)" }}
    >
      {text}
    </div>
  );
}
