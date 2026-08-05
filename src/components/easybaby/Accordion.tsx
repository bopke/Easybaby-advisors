"use client";

import { useState } from "react";

// Click-to-expand question/answer item — used for the "Kim jest..." and
// verification-badge explanations above the specialist map.
export function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"eb-accordion" + (open ? " is-open" : "")}>
      <button
        type="button"
        className="eb-accordion__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{question}</span>
        <span className="eb-accordion__chevron" aria-hidden="true" />
      </button>
      {open && <p className="eb-accordion__panel">{answer}</p>}
    </div>
  );
}
