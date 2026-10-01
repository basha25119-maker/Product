import { cn } from "@/lib/utils";

/**
 * "Setvion AI Solutions" gold-gradient wordmark with an animated sheen,
 * matching the brand logo. Used as a small credit badge, not the product
 * name (the product itself is "Business Manager").
 */
export function SetvionMark({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("select-none text-center", className)}>
      <p
        className={cn(
          "setvion-shimmer font-bold tracking-wide",
          size === "sm" ? "text-xs" : "text-base"
        )}
      >
        SETVION AI SOLUTIONS
      </p>
      {size === "md" && (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/30">
          Building Bridges With Modern Technology
        </p>
      )}
    </div>
  );
}
