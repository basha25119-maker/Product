"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Left slide-in navigation drawer for screens below the `lg` breakpoint
 * (phones and tablets). Closed state is `invisible`, so its links are not
 * reachable by keyboard or screen readers while off-screen.
 */
export function Drawer({
  id,
  open,
  onClose,
  label,
  className,
  children,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto shadow-premium-lg transition-[transform,visibility] duration-200 ease-out",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
          className
        )}
      >
        {children}
      </aside>
    </div>
  );
}
