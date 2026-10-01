import { cn } from "@/lib/utils";

/**
 * Slowly drifting gold blobs behind dark panels, echoing the Setvion AI
 * Solutions mark. Pure CSS (see .setvion-blob keyframes in globals.css) —
 * no JS/canvas, so it's cheap on the sidebar and auth screens alike.
 */
export function SetvionBackground({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="setvion-blob setvion-blob-1" />
      <div className="setvion-blob setvion-blob-2" />
      {dense && <div className="setvion-blob setvion-blob-3" />}
      <div className="setvion-grain" />
    </div>
  );
}
