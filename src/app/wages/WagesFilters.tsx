"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input, Select } from "@/components/ui/Field";

type Branch = { id: string; name: string };

export function WagesFilters({ branches, month }: { branches: Branch[]; month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input type="month" className="w-auto" value={month} onChange={(e) => setParam("month", e.target.value)} />
      <Select className="w-auto min-w-[160px]" value={searchParams.get("branch") ?? "all"} onChange={(e) => setParam("branch", e.target.value)}>
        <option value="all">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
