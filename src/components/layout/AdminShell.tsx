"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Users2, Settings, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetvionBackground } from "@/components/brand/SetvionBackground";
import { SetvionMark } from "@/components/brand/SetvionMark";
import { Drawer } from "./Drawer";

const nav = [
  { href: "/admin", label: "Platform Dashboard", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Customers", icon: Users2 },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

const DRAWER_ID = "admin-nav-drawer";

function SidebarBody({
  adminEmail,
  pathname,
  onNavigate,
  onClose,
}: {
  adminEmail: string;
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <SetvionBackground />
      <div className="relative px-4 pt-5">
        <SetvionMark size="sm" className="w-full" />
      </div>
      <div className="relative flex items-center justify-between gap-2 px-6 py-5">
        <Link href="/admin" onClick={onNavigate} className="flex min-w-0 items-center gap-2" title="Go to platform dashboard">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">Platform Admin</p>
            <p className="text-[11px] text-white/50">Business Manager</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="relative flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-white/10 px-3 py-3">
        <div className="mb-2 truncate px-3 text-xs text-white/40">{adminEmail}</div>
        <form action="/api/admin/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminShell({ adminEmail, children }: { adminEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop / laptop sidebar (lg and up) */}
      <aside className="relative hidden h-screen w-64 shrink-0 flex-col self-start overflow-hidden border-r border-border bg-[#0f1424] text-white lg:sticky lg:top-0 lg:flex">
        <SidebarBody adminEmail={adminEmail} pathname={pathname} />
      </aside>

      {/* Phone / tablet navigation drawer (below lg) */}
      <Drawer id={DRAWER_ID} open={menuOpen} onClose={closeMenu} label="Admin navigation" className="bg-[#0f1424] text-white">
        <SidebarBody adminEmail={adminEmail} pathname={pathname} onNavigate={closeMenu} onClose={closeMenu} />
      </Drawer>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0f1424] px-3 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={DRAWER_ID}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" className="flex min-w-0 items-center gap-2" title="Go to platform dashboard">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck size={16} />
            </div>
            <span className="truncate text-sm font-bold">Platform Admin</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
