"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Users,
  Building2,
  Wallet,
  Home,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "./Drawer";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/wages", label: "Wages", icon: Wallet },
  { href: "/rent", label: "Rent", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const DRAWER_ID = "customer-nav-drawer";

function SidebarBody({
  businessName,
  userEmail,
  pathname,
  onNavigate,
  onClose,
}: {
  businessName: string;
  userEmail: string;
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-6 py-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2" title="Go to dashboard">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">{businessName}</p>
            <p className="text-[11px] text-muted-foreground">Business Manager</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{userEmail}</div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export function DashboardShell({
  businessName,
  userEmail,
  children,
}: {
  businessName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop / laptop sidebar (lg and up) */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col self-start border-r border-border bg-card lg:sticky lg:top-0 lg:flex">
        <SidebarBody businessName={businessName} userEmail={userEmail} pathname={pathname} />
      </aside>

      {/* Phone / tablet navigation drawer (below lg) */}
      <Drawer id={DRAWER_ID} open={menuOpen} onClose={closeMenu} label="Main navigation" className="bg-card text-foreground">
        <SidebarBody
          businessName={businessName}
          userEmail={userEmail}
          pathname={pathname}
          onNavigate={closeMenu}
          onClose={closeMenu}
        />
      </Drawer>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={DRAWER_ID}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          >
            <Menu size={22} />
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2" title="Go to dashboard">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase size={16} />
            </div>
            <span className="truncate text-sm font-bold">{businessName}</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
