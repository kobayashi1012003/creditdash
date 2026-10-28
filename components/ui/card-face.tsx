"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import type { Card } from "@/data/types";
import { CARD_ART } from "@/data/card-art.generated";
import { cn } from "@/lib/cn";

/**
 * The card itself. Uses the art in public/cards/ when a file exists for the
 * card, and otherwise draws a face from the card's own data, so the app never
 * shows a broken image.
 *
 * Standard credit card ratio is 1.586:1 (ISO/IEC 7810 ID-1).
 */

type CardFaceProps = {
  card: Card;
  /** Tilt and sheen follow the pointer. Off inside dense grids and lists. */
  interactive?: boolean;
  /** Dims the card when another one is the answer to the current question. */
  dimmed?: boolean;
  priority?: boolean;
  className?: string;
};

export function CardFace({
  card,
  interactive = false,
  dimmed = false,
  priority = false,
  className,
}: CardFaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);

  // Card art comes from a manifest of what is actually in public/cards/,
  // generated at build time. Most cards have no art, so asking the network
  // and waiting for a 404 would paint a blank card for a frame on the common
  // path. The onError is still here for the case where a file is removed
  // between a build and a request: the generated face takes over and the app
  // never shows a broken image.
  const [imageFailed, setImageFailed] = useState(false);
  const declaredSrc = card.imagePath ?? CARD_ART[card.id];
  const imageSrc = imageFailed ? null : declaredSrc;

  // Pointer position as a fraction of the card, -0.5 to 0.5 on each axis.
  // Motion values rather than state: state would re-render the tree on every
  // pointer move and collapse on a mid-range phone.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Spring the raw pointer value so the tilt has momentum instead of locking
  // rigidly to the cursor, which reads as mechanical.
  const sx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 140, damping: 18, mass: 0.6 });

  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8, 8]);

  // Full transform string, not Motion's x/y/scale shorthands: the shorthands
  // run on the main thread and drop frames while the page is still loading.
  const transform = useTransform(
    [rotateX, rotateY],
    ([rx, ry]: number[]) =>
      `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`,
  );

  // The sheen tracks the pointer across the face.
  const sheenX = useTransform(sx, [-0.5, 0.5], ["15%", "85%"]);
  const sheenY = useTransform(sy, [-0.5, 0.5], ["10%", "90%"]);
  const sheen = useTransform(
    [sheenX, sheenY],
    ([x, y]: string[]) =>
      `radial-gradient(60% 80% at ${x} ${y}, rgb(255 255 255 / 0.22), transparent 70%)`,
  );

  const tilts = interactive && !reduceMotion;

  function onPointerMove(e: React.PointerEvent) {
    if (!tilts || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave() {
    setHovering(false);
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={onPointerLeave}
      style={tilts ? { transform } : undefined}
      className={cn(
        // Container query context: the type and chip inside scale with the
        // card's own width, so one component works in the hero and in a
        // dense grid without separate size variants.
        "@container relative aspect-[1.586/1] w-full overflow-hidden rounded-inner",
        "transition-opacity duration-[var(--cd-dur-hover)] ease-out",
        dimmed && "opacity-40",
        className,
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${card.issuer} ${card.name}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 90vw, 360px"
          onError={() => setImageFailed(true)}
          className="object-cover"
        />
      ) : (
        <GeneratedFace card={card} />
      )}

      {/* Sheen. Decorative, so it is gone under reduced motion and never
          appears on touch, where there is no pointer to follow. */}
      {tilts && (
        <motion.div
          aria-hidden
          style={{ background: sheen, opacity: hovering ? 1 : 0 }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--cd-dur-hover)] ease-out"
        />
      )}

      {/* A hairline inside the edge keeps a dark card from dissolving into a
          dark page. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-inner ring-1 ring-inset ring-black/10 dark:ring-white/10"
      />
    </motion.div>
  );
}

/**
 * The fallback face, drawn from the card's own `faceStyle`. Not a placeholder:
 * it is what most cards will use until real art is licensed.
 */
function GeneratedFace({ card }: { card: Card }) {
  const { base, shade, foil, finish } = card.faceStyle;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-[7%]"
      style={{
        background: `linear-gradient(152deg, ${base} 0%, ${shade} 62%, ${base} 100%)`,
      }}
    >
      {/* Metal cards get a single soft diagonal highlight. Matte cards do not,
          which is the whole difference between the two finishes. */}
      {finish === "metal" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(104deg, transparent 32%, rgb(255 255 255 / 0.14) 48%, transparent 62%)",
          }}
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <span
          className="truncate text-[clamp(0.6rem,2.6cqw,0.8rem)] font-medium tracking-wide @max-[200px]:hidden"
          style={{ color: foil, opacity: 0.85 }}
        >
          {card.issuer}
        </span>
        <NetworkMark network={card.network} foil={foil} />
      </div>

      <div className="relative">
        <Chip foil={foil} />
        <p
          // Below ~200px the face cannot hold its own name legibly, and the
          // name is printed under the card anyway, so it drops out rather
          // than shrinking into illegibility.
          className="mt-[6%] line-clamp-2 font-display text-[clamp(0.85rem,4.4cqw,1.5rem)] leading-[1.15] @max-[200px]:hidden"
          style={{ color: foil }}
        >
          {card.name}
        </p>
      </div>
    </div>
  );
}

/** The contact chip. A simple geometric mark, drawn once and reused. */
function Chip({ foil }: { foil: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 34 26"
      className="h-[clamp(16px,9cqw,26px)] w-auto"
      style={{ color: foil }}
    >
      <rect
        x="0.75"
        y="0.75"
        width="32.5"
        height="24.5"
        rx="4"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <path
        d="M12 1v24M22 1v24M1 9h11M22 9h11M1 17h11M22 17h11"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function NetworkMark({
  network,
  foil,
}: {
  network: Card["network"];
  foil: string;
}) {
  if (network === "mastercard") {
    return (
      <svg aria-hidden viewBox="0 0 44 28" className="h-[clamp(14px,7cqw,22px)] w-auto" style={{ color: foil }}>
        <circle cx="16" cy="14" r="12" fill="currentColor" fillOpacity="0.55" />
        <circle cx="28" cy="14" r="12" fill="currentColor" fillOpacity="0.3" />
      </svg>
    );
  }

  if (network === "visa") {
    return (
      <span
        className="font-display text-[clamp(0.7rem,3.2cqw,1.05rem)] italic tracking-tight"
        style={{ color: foil, opacity: 0.8 }}
      >
        VISA
      </span>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 26 26" className="h-[clamp(14px,7cqw,22px)] w-auto" style={{ color: foil }}>
      <rect x="1" y="1" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" />
      <path d="M7 18 13 8l6 10" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" />
    </svg>
  );
}
