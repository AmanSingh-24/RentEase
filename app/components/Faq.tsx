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
    id: "verified-properties",
    question: "Are all properties verified?",
    answer:
      "Yes. Every property listed on RentEase is reviewed before going live, helping tenants discover trusted rental homes with confidence.",
  },
  {
    id: "book-visit",
    question: "How do I book a property visit?",
    answer:
      "Submit an inquiry with your contact details. The property owner is notified instantly and can approve your request to schedule a visit.",
  },
  {
    id: "digital-onboarding",
    question: "How does the rental onboarding work?",
    answer:
      "Once your request is approved, you'll complete a digital rental agreement, pay your security deposit and first month's rent, then move into your new home.",
  },
  {
    id: "digital-inspection",
    question: "What is the digital inspection process?",
    answer:
      "Before using your dashboard, you'll upload room-by-room timestamped photos. The owner reviews them to create a transparent move-in record for both parties.",
  },
  {
    id: "maintenance",
    question: "Can I report maintenance issues?",
    answer:
      "Absolutely. Raise maintenance requests directly from your dashboard, track their progress, and receive updates from your property owner.",
  },
  {
    id: "payments",
    question: "Can I manage rent payments online?",
    answer:
      "Yes. Securely pay rent through the platform, access payment history, and track all your rental transactions in one place.",
  },
  {
    id: "communication",
    question: "Can tenants and owners chat on RentEase?",
    answer:
      "Yes. Built-in messaging allows one-to-one conversations, while owners can also send important announcements to all their tenants.",
  },
  {
  id: "disputes",
  question: "How does RentEase help prevent rental disputes?",
  answer:
    "Timestamped move-in inspections, digital agreements, payment records, and maintenance history provide a transparent record for both tenants and owners."
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