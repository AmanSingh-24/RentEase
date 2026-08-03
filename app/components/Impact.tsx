import Image from "next/image";

type Stat = {
  value: string;
  label: string;
};

const STATS: Stat[] = [
  { value: "460+", label: "Verified Properties" },
  { value: "10+", label: "Active Homes" },
  { value: "95%", label: "Happy Clients" },
];

export default function Impact() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-28">
      {/* Faint decorative linework in the top-right corner */}
      <svg
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-neutral-200/60"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M40 360 200 40l160 320M110 220h180"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header row */}
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
              </span>
              <span className="text-sm font-medium uppercase tracking-wider text-neutral-500">
                OUR IMPACT
              </span>
            </div>

            {/* Heading */}
            <h2 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-neutral-950 sm:text-6xl">
              <span className="block">Everything You Need</span>
              <span className="block">to Manage a Rental</span>
            </h2>
          </div>

          {/* Supporting copy */}
          <p className="max-w-xs text-base text-neutral-500 sm:pt-2 sm:text-right sm:text-md">
            From discovering verified homes to managing payments, inspections, maintenance, and move-outs, RentEase simplifies every step of the rental journey.
          </p>
        </div>

        {/* Image / stats / image row */}
        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr_1fr] lg:gap-4">
          {/* Left image */}
          <div className="relative h-[320px] overflow-hidden rounded-3xl lg:h-auto">
            <Image
              src="/impact-1.png"
              alt="Modern concrete and timber home exterior"
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-col overflow-hidden rounded-3xl bg-neutral-100">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-1 items-center justify-between px-8 py-8 sm:px-10 ${
                  i !== STATS.length - 1 ? "border-b border-neutral-200" : ""
                }`}
              >
                <span className="text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
                  {stat.value}
                </span>
                <span className="text-base font-semibold uppercase tracking-wide text-neutral-800 sm:text-xl">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Right image */}
          <div className="relative h-[320px] overflow-hidden rounded-3xl lg:h-auto">
            <Image
              src="/impact-2.png"
              alt="Modern hillside home exterior"
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}