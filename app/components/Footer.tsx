"use client";

import Image from "next/image";
import {
  ArrowRight,
  Facebook,
  Home,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";

export interface FooterNavLink {
  label: string;
  href: string;
}

export interface FooterProps {
  badge?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  bgImageSrc?: string;
  logoLabel?: string;
  tagline?: string;
  exploreLinks?: FooterNavLink[];
  contactEmail?: string;
  contactPhone?: string;
  contactLocation?: string;
  copyrightText?: string;
  craftedByLabel?: string;
  privacyHref?: string;
  className?: string;
}

const DEFAULT_EXPLORE_LINKS: FooterNavLink[] = [
  { label: "Properties", href: "#" },
  { label: "Services", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact Us", href: "#" },
];

/** Minimal inline X (Twitter) glyph — lucide doesn't ship the current logo. */
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.828l-5.35-6.554L4.7 22H1.44l8.02-9.17L1 2h6.994l4.84 5.995L18.244 2Zm-1.197 18h1.804L7.045 3.9H5.117L17.047 20Z" />
    </svg>
  );
}

export default function Footer({
  badge = "Find your next home",
  heading = "Discover homes designed\nfor your lifestyle",
  description = "Explore properties, compare options, and move forward with confidence — everything you need in one place.",
  ctaLabel = "Get In Touch",
  ctaHref = "#contact",
  bgImageSrc = "/footer.png",
  logoLabel = "Homy",
  tagline = "Find, explore, and choose your next home with a simple and modern experience.",
  exploreLinks = DEFAULT_EXPLORE_LINKS,
  contactEmail = "homy@yourdomain.com",
  contactPhone = "+123 456 000",
  contactLocation = "New York, USA",
  copyrightText = "Copyright ©2026",
  craftedByLabel = "Crafted by",
  privacyHref = "#",
  className = "",
}: FooterProps) {
  return (
    <footer className={`w-full bg-white px-4 py-4 sm:px-6 sm:py-6 md:px-1 md:py-1 ${className}`}>
      <div className="relative h-[720px] w-full overflow-hidden rounded-[32px] bg-neutral-950 md:h-[820px] md:rounded-[48px] lg:h-[900px]">
        {/* Background Layer (z-0) — single image: sky fading into the house */}
        <Image
          src={bgImageSrc}
          alt="Featured modern home"
          fill
          priority
          loading="eager"
          sizes="100vw"
          className="z-0 object-cover object-center"
        />

        {/* Readability overlay (z-10) — subtle at top for the heading, deeper toward the bottom where nav sits */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-black/80" />

        {/* Extra blend layer (z-10) — soft, gradual darkening so the nav feels like part of the photo, not a bar on top of it */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-[55%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content Layer (z-20) — badge, heading, description, CTA */}
        <div className="relative z-20 flex flex-col items-center px-6 pt-14 text-center md:pt-16">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            {badge}
          </div>

          <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            {heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          <p className="mt-5 max-w-md text-base text-white/70">{description}</p>

          
<a
  href={ctaHref}
  className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
>
  {ctaLabel}
  <ArrowRight size={14} strokeWidth={2.5} />
</a>
        </div>

        {/* Footer nav — no solid bar, just sits in the darkened base of the image */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-10 pt-24 md:grid-cols-[1.4fr_1fr_1fr] md:gap-6 md:px-10 md:pt-28">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2 text-white">
                <Home size={18} />
                <span className="text-lg font-bold">{logoLabel}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-white/60">{tagline}</p>
              <div className="mt-5 flex items-center gap-3">
{[Instagram, Facebook, XIcon, Youtube].map((Icon, i) => (
  <a
    key={i}
    href="#"
    aria-label="Social link"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/50 hover:text-white"
  >
    <Icon size={14} />
  </a>
))}
              </div>
            </div>

            {/* Explore column */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Explore</p>
              <ul className="flex flex-col gap-3">
{exploreLinks.map((link) => (
  <li key={link.label}>
    <a
      href={link.href}
      className="text-sm text-white/60 transition-colors hover:text-white"
    >
      {link.label}
    </a>
  </li>
))}
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Contact</p>
              <ul className="flex flex-col gap-3 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <Mail size={14} />
                  {contactEmail}
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} />
                  {contactPhone}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} />
                  {contactLocation}
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-5 text-xs text-white/50 md:flex-row md:justify-between md:px-10">
              <span>{copyrightText}</span>
              <span className="flex items-center gap-1.5">
                {craftedByLabel}
                <span className="font-semibold text-white/70">Framer</span>
              </span>
              <a href={privacyHref} className="transition-colors hover:text-white">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}