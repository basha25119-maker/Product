"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Users2, Building, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Platform Dashboard", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Customers", icon: Users2 },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

export function AdminShell({ adminEmail, children }: { adminEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-[#0f1424] text-white md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Platform Admin</p>
            <p className="text-[11px] text-white/50">Business Manager</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          <div className="mb-2 truncate px-3 text-xs text-white/40">{adminEmail}</div>
          <form action="/api/admin/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
