"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  items?: FAQItem[];
  /** Index of the item expanded by default. Pass null for none open. */
  defaultOpenIndex?: number | null;
  className?: string;
}

const DEFAULT_ITEMS: FAQItem[] = [
  {
    id: "start-searching",
    question: "How do I start searching for a home?",
    answer:
      "You can browse available properties, apply filters, and explore listings based on your needs and location.",
  },
  {
    id: "filter-budget",
    question: "Can I filter homes by budget & location?",
    answer:
      "Yes — use the filters panel to narrow listings by price range, city, neighborhood, and more.",
  },
  {
    id: "accurate-details",
    question: "Are the property details accurate?",
    answer:
      "Listings are verified and regularly updated by our team and partner agents to keep details accurate.",
  },
  {
    id: "contact-owner",
    question: "How do I contact a owner or agent?",
    answer:
      "Open any listing and use the contact card to message the owner or agent directly from the platform.",
  },
  {
    id: "rent-or-buy",
    question: "Can I explore rental and buying options",
    answer:
      "Absolutely — toggle between rent and buy at the top of the listings page to switch between both.",
  },
  {
    id: "account-needed",
    question: "Do I need an account to use platform",
    answer:
      "You can browse freely without an account. Creating one lets you save favorites and contact owners.",
  },
  {
    id: "availability",
    question: "How do I know if a property is available?",
    answer:
      "Each listing shows a live availability status, updated as soon as a property is rented or sold.",
  },
];

export default function FAQ({
  eyebrow = "FAQ",
  heading = "Things You\nShould Know",
  description = "We've answered the most common questions to help you get started with clarity.",
  items = DEFAULT_ITEMS,
  defaultOpenIndex = 0,
  className = "",
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section className={`w-full bg-white px-8 py-16 md:px-16 md:py-20 lg:px-28 lg:py-24 ${className}`}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        {/* Left column */}
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </span>
            {eyebrow.toUpperCase()}
          </div>
          <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-black md:text-5xl">
            {heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-6 max-w-sm text-neutral-500">{description}</p>
        </div>

        {/* Right column — accordion */}
        <div className="flex flex-col gap-4">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-neutral-100 px-6 py-6 transition-colors duration-300 md:px-8"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 text-left"
                >
                  <span className="text-lg font-semibold text-black md:text-xl">
                    {item.question}
                  </span>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-black">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pt-4 text-neutral-500">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}