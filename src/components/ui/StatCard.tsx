import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative";
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold tracking-tight",
              tone === "positive" && "text-success",
              tone === "negative" && "text-danger"
            )}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-primary/5 p-2.5 text-primary">
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}
