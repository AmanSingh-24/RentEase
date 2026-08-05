import Image from "next/image";
import { Quote } from "lucide-react";

export interface ReviewItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
  variant?: "standard" | "photo";
  photoSrc?: string;
}

export interface ReviewsProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  items?: ReviewItem[];
  /** id of the item that stays fixed in place (defaults to the first "photo" variant item) */
  fixedItemId?: string;
  className?: string;
}

const DEFAULT_ITEMS: ReviewItem[] = [
  {
    id: "1",
    quote:
      "The digital inspection with timestamped photos made move-in incredibly smooth. Both my landlord and I had complete peace of mind.",
    name: "Rahul Sharma",
    role: "Tenant",
    avatarSrc: "/p-1.png",
    variant: "standard",
  },
  {
    id: "2",
    quote:
      "Managing rent payments, maintenance requests, and documents from one dashboard has saved me hours every single month.",
    name: "Priya Singh",
    role: "Property Owner",
    avatarSrc: "/p-2.png",
    variant: "standard",
  },
  {
    id: "3",
    quote:
      "Verified listings and a transparent onboarding process gave me confidence before signing my rental agreement online.",
    name: "Manish Kapoor",
    role: "Tenant",
    avatarSrc: "/p-3.png",
    variant: "standard",
  },
  {
    id: "4",
    quote:
      "RentEase transformed how I manage multiple properties. Everything from applications to inspections is finally organized in one place.",
    name: "Rentease",
    role: "Property Management Platform",
    avatarSrc: "/main2.png",
    photoSrc: "/main2.png",
    variant: "photo",
  },
  {
    id: "5",
    quote:
      "Maintenance issues are tracked from start to finish, and I always know what's happening without endless phone calls.",
    name: "Maya Verma",
    role: "Tenant",
    avatarSrc: "/p-4.png",
    variant: "standard",
  },
  {
    id: "6",
    quote:
      "The platform makes renting feel professional. Payments, communication, and documents are all handled seamlessly in one ecosystem.",
    name: "Karan Mehta",
    role: "Property Owner",
    avatarSrc: "/p-5.png",
    variant: "standard",
  },
];

function StandardCard({ item }: { item: ReviewItem }) {
  return (
    <div className="flex h-[560px] w-[380px] shrink-0 flex-col justify-between rounded-3xl bg-neutral-100 p-8">
      <div>
        <Quote size={28} className="text-neutral-300" fill="currentColor" strokeWidth={0} />
        <p className="mt-6 text-lg leading-relaxed text-neutral-800">{item.quote}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
          <Image src={item.avatarSrc} alt={item.name} fill sizes="44px" className="object-cover" />
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">{item.name}</p>
          <p className="text-sm text-neutral-500">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ item }: { item: ReviewItem }) {
  return (
    <div className="relative h-[560px] w-[380px] shrink-0 overflow-hidden rounded-3xl bg-neutral-800">
      <Image
        src={item.photoSrc ?? item.avatarSrc}
        alt={item.name}
        fill
        sizes="380px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8">
        <p className="text-2xl font-bold text-white">{item.name}</p>
        <p className="mt-1 text-sm font-medium text-white/80">{item.role}</p>
      </div>
    </div>
  );
}

export default function Reviews({
eyebrow = "CLIENT REVIEWS",
heading = "Built for better\nrenting experiences",
description ="See how tenants and property owners use RentEase to simplify rentals, reduce disputes, and manage everything from one platform.",
  items = DEFAULT_ITEMS,
  fixedItemId,
  className = "",
}: ReviewsProps) {
  const fixedItem =
    items.find((item) => item.id === fixedItemId) ??
    items.find((item) => item.variant === "photo") ??
    items[items.length - 1];

  const scrollingItems = items.filter((item) => item.id !== fixedItem.id);
  const track = [...scrollingItems, ...scrollingItems];

  return (
    <section className={`w-full overflow-hidden bg-[#F9FAFB] py-20 px-35 ${className}`}>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-end md:px-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </span>
            {eyebrow}
          </div>

          <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 md:text-5xl">
            {heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <p className="max-w-sm text-base text-neutral-500 md:text-right">{description}</p>
      </div>

      <div className="relative mt-14 flex items-stretch gap-6 pl-6 md:pl-10">
        {/* Scrolling track — everything except the fixed card */}
        <div className="group relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_100%)]">
          <div className="animate-marquee flex w-max gap-6 group-hover:[animation-play-state:paused]">
            {track.map((item, i) => (
              <StandardCard key={`${item.id}-${i}`} item={item} />
            ))}
          </div>
        </div>

        {/* Fixed card — stays in place, never animates */}
        <div className="shrink-0">
          <PhotoCard item={fixedItem} />
        </div>
      </div>

      <style>{`
        @keyframes marquee-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee-left 45s linear infinite;
        }
      `}</style>
    </section>
  );
}