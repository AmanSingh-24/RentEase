"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

interface Feature {
  id: number;
  indexStr: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
}

const FEATURES: Feature[] = [
  {
    id: 1,
    indexStr: ".01",
    title: "Digital Inspection",
    description:
      "Capture room-by-room photos with automatic timestamps before moving in. Every approved image becomes trusted digital evidence for both tenants and property owners.",
    bullets: ["Camera-only capture", "Automatic timestamps", "Owner verification"],
    image: "/m-1.png",
  },
  {
    id: 2,
    indexStr: ".02",
    title: "Rent Payments",
    description:
      "Manage monthly rent, deposits, invoices and payment history from one dashboard with secure online payments and reminders.",
    bullets: ["Payment tracking", "Rent reminders", "Digital receipts"],
    image: "/m-2.png",
  },
  {
    id: 3,
    indexStr: ".03",
    title: "Maintenance Requests",
    description:
      "Raise maintenance issues with photos, monitor progress, and receive live updates until the request is resolved.",
    bullets: ["Photo uploads", "Real-time updates", "Owner notifications"],
    image: "/m-3.png",
  },
  {
    id: 4,
    indexStr: ".04",
    title: "Tenant & Owner Chat",
    description:
      "Communicate instantly through secure one-to-one conversations or broadcast important announcements.",
    bullets: ["Private messaging", "Broadcast updates", "Instant notifications"],
    image: "/m-4.png",
  },
  {
    id: 5,
    indexStr: ".05",
    title: "Move-Out Workflow",
    description:
      "Submit exit notices digitally, compare inspections, verify damages and complete your tenancy with transparency.",
    bullets: ["Exit notices", "Damage comparison", "Refund tracking"],
    image: "/m-5.png",
  },
  {
    id: 6,
    indexStr: ".06",
    title: "Owner Dashboard",
    description:
      "Manage properties, tenant applications, inspections, payments and analytics from one centralized workspace.",
    bullets: ["Property management", "Applications", "Analytics"],
    image: "/m-6.png",
  },
];

function StackCard({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  const reverse = index % 2 !== 0;
  const topOffset = 250 + index * 20;

  return (
    <div
      className="sticky mb-10 w-full"
      style={{
        top: `${topOffset}px`,
        zIndex: index + 1,
      }}
    >
      <div className="mx-auto w-full overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-300">
        <div className="grid grid-cols-1 items-stretch min-h-[380px] lg:grid-cols-12">
          {/* Content side */}
          <div
            className={`flex flex-col justify-center p-8 md:p-12 lg:p-14 lg:col-span-7 ${
              reverse ? "lg:order-2" : "lg:order-1"
            }`}
          >
            {/* Number numeral badge matching Services component style */}
            <span className="text-5xl font-bold tracking-tight text-neutral-400 mb-2">
              {feature.indexStr}
            </span>

            <h3 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
              {feature.title}
            </h3>

            <p className="mt-4 text-base leading-relaxed text-neutral-500 font-normal">
              {feature.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 pt-6 border-t border-neutral-100">
              {feature.bullets.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="text-neutral-900" size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edge-to-edge image side */}
          <div
            className={`relative min-h-[280px] lg:min-h-full lg:col-span-5 ${
              reverse ? "lg:order-1" : "lg:order-2"
            }`}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
              priority={index < 2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Management() {
  return (
    <section className="relative bg-white py-24 sm:py-28">
      <div className="relative mx-auto w-[96%] max-w-[1800px] px-2 lg:px-4">
        {/* Header row */}
        <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* Eyebrow */}
            <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
              </span>
              Rental Management
            </div>

            {/* Heading */}
            <h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 md:text-5xl">
              <span className="block">Everything After</span>
              <span className="block">Move-In</span>
            </h2>
          </div>

          {/* Supporting copy */}
          <p className="max-w-xs text-neutral-500 lg:text-right">
            RentEase doesn't stop once a property is rented. It manages inspections, payments, maintenance, communication and move-out inside one seamless digital platform.
          </p>
        </div>

        {/* Stacked Cards Container */}
        <div className="relative pb-24">
          {FEATURES.map((feature, index) => (
            <StackCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}