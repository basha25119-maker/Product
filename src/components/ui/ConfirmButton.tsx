"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function ConfirmButton({
  action,
  confirmText,
  className,
  children,
}: {
  action: () => Promise<void> | void;
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn("text-xs font-medium disabled:opacity-50", className)}
      onClick={() => {
        if (confirm(confirmText)) {
          startTransition(() => {
            action();
          });
        }
      }}
    >
      {pending ? "..." : children}
    </button>
  );
}
