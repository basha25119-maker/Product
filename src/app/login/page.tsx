import { Briefcase, BarChart3, ShieldCheck, Building2 } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: BarChart3, text: "Real-time revenue, expenses and profit at a glance" },
  { icon: Building2, text: "Manage every branch and worker from one place" },
  { icon: ShieldCheck, text: "Your data is fully private to your business" },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session?.type === "user") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0f1424] via-[#171d33] to-[#0f1424] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(124,58,237,0.25), transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
            <Briefcase size={20} />
          </div>
          <span className="text-lg font-bold">Business Manager</span>
        </div>

        <div className="relative">
          <h2 className="mb-4 max-w-md text-3xl font-bold leading-tight">
            Run your business finances with total clarity.
          </h2>
          <p className="mb-8 max-w-md text-white/60">
            Sales, wages, rent and expenses — all in one clean workspace built for owners who want
            answers, not spreadsheets.
          </p>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon size={16} />
                </div>
                <span className="text-sm text-white/70">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/30">&copy; {new Date().getFullYear()} Business Manager</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-premium-lg">
              <Briefcase size={22} />
            </div>
            <h1 className="text-xl font-bold">Business Manager</h1>
          </div>
          <div className="mb-6 hidden text-center lg:block">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your business</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium-lg">
            <LoginForm />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Platform administrator?</span>
            <Link href="/admin/login" className="font-semibold text-accent hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
