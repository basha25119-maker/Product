"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/Field";

type Branch = { id: string; name: string };

const RANGE_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_week", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export function FiltersBar({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        className="w-auto min-w-[160px]"
        value={searchParams.get("branch") ?? "all"}
        onChange={(e) => setParam("branch", e.target.value)}
      >
        <option value="all">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <Select
        className="w-auto min-w-[160px]"
        value={searchParams.get("range") ?? "this_month"}
        onChange={(e) => setParam("range", e.target.value)}
      >
        {RANGE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
