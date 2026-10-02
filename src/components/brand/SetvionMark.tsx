import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Highlighted "Setvion AI Solutions" lockup: bridge icon + gold shimmer
 * wordmark inside a softly glowing gold-edged pill. Meant to sit at the top
 * of a page/panel as the company credit (the product itself stays
 * "Business Manager").
 */
export function SetvionMark({
  className,
  size = "md",
  tagline = false,
}: {
  className?: string;
  size?: "sm" | "md";
  tagline?: boolean;
}) {
  const iconH = size === "sm" ? 22 : 30;
  const iconW = Math.round(iconH * (530 / 210));

  return (
    <div
      className={cn(
        "setvion-glow inline-flex select-none items-center gap-3 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#d4af37]/15 via-[#f5d485]/10 to-[#d4af37]/15 backdrop-blur-sm",
        size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5",
        className
      )}
    >
      <Image
        src="/setvion-bridge.png"
        alt=""
        width={iconW}
        height={iconH}
        priority
        className="shrink-0"
        style={{ height: iconH, width: iconW }}
      />
      <div className="leading-tight">
        <p className={cn("setvion-shimmer font-extrabold tracking-wider", size === "sm" ? "text-xs" : "text-sm")}>
          SETVION AI SOLUTIONS
        </p>
        {tagline && (
          <p className="mt-0.5 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.14em] text-[#e8c874]/70">
            Building Bridges With Modern Technology
          </p>
        )}
      </div>
    </div>
  );
}
