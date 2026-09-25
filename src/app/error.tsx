"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-danger">Something went wrong</p>
      <h1 className="text-xl font-semibold">We hit an unexpected error</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Please try again. If this keeps happening, contact support.</p>
      <Button onClick={() => reset()} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
