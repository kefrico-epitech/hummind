"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <li
            key={item.question}
            className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[14px] font-medium text-white/90 transition-colors hover:text-white"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[13px] leading-relaxed text-white/60">
                {item.answer}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
