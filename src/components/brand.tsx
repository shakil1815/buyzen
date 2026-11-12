import Link from "next/link";

/**
 * BuyZen brand mark - an inline SVG so it inherits the active theme and needs
 * no extra network request. The same artwork is available as static files at
 * /brand/buyzen-mark.svg and /brand/buyzen-logo.svg.
 */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="BuyZen"
    >
      <defs>
        <linearGradient id="bzBag" x1="0.05" y1="1" x2="0.95" y2="0">
          <stop offset="0%" stopColor="#08194C" />
          <stop offset="42%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="bzSwoosh" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="55%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
      </defs>

      <path
        d="M198 176 C 198 96, 314 96, 314 176"
        fill="none"
        stroke="#08194C"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M214 176 C 214 116, 298 116, 298 176"
        fill="none"
        stroke="#2F6BE8"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M92 404 C 30 320, 118 248, 246 256 C 372 264, 456 322, 474 244"
        fill="none"
        stroke="url(#bzSwoosh)"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M92 404 C 58 372, 62 330, 92 306"
        fill="none"
        stroke="#EA580C"
        strokeWidth="26"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M152 170 H 360 C 392 170 412 194 405 226 L 378 382 C 372 416 344 440 310 440 H 188 C 154 440 126 416 120 382 L 98 226 C 92 194 112 170 144 170 Z"
        fill="url(#bzBag)"
      />
      <path
        fill="#FFFFFF"
        d="M236 206 h 84 c 37 0 61 19 61 47 c 0 16 -7 28 -19 35 c 15 6 24 19 24 36 c 0 30 -25 49 -62 49 h -88 z m 36 30 v 27 h 43 c 17 0 26 -5 26 -14 c 0 -8 -9 -13 -26 -13 z m 0 54 v 30 h 46 c 18 0 27 -6 27 -15 c 0 -9 -9 -15 -27 -15 z"
      />
      <g stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round">
        <path d="M300 268 h 48" />
        <path d="M300 296 h 42" />
      </g>
      <circle cx="300" cy="352" r="10" fill="#FFFFFF" />
      <circle cx="338" cy="352" r="10" fill="#FFFFFF" />
    </svg>
  );
}

/** Full lock-up: mark + BUYZen wordmark + tagline. */
export function Brand({
  tagline = false,
  className = "",
}: {
  tagline?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className="h-9 w-9 shrink-0" />
      <span className="leading-none">
        <span className="block text-lg font-black italic tracking-tight text-fg-strong">
          <span className="text-fg-strong">BUY</span>
          <span className="text-orange-500">Zen</span>
        </span>
        {tagline ? (
          <span className="mt-1 block text-[10px] font-semibold italic tracking-wide text-fg-muted">
            Everything You Need. One Place.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
