import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "./AdminLoginForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SetvionBackground } from "@/components/brand/SetvionBackground";
import { SetvionMark } from "@/components/brand/SetvionMark";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.type === "admin") redirect("/admin");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0e19] px-4">
      <SetvionBackground dense />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <SetvionMark tagline />
        </div>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-xl font-bold text-white">Platform Admin</h1>
          <p className="mt-1 text-sm text-white/40">Business Manager operator console</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-premium-lg">
          <AdminLoginForm />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <span className="text-white/40">Not an admin?</span>
          <Link href="/login" className="font-semibold text-white hover:underline">
            Customer sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
