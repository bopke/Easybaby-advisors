"use client";

import { useState } from "react";

// Click-to-expand question/answer item — used for the "Kim jest..." and
// verification-badge explanations above the specialist map. `answer` may
// contain multiple paragraphs separated by a blank line (e.g. the "Polecany
// Specjalista" item folds in the general "how this list works" copy too).
export function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const paragraphs = answer.split(/\n\s*\n/);
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
      {open && paragraphs.map((p, i) => (
        <p key={i} className="eb-accordion__panel">{p}</p>
      ))}
    </div>
  );
}
