import { Scissors } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.type === "user") redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1424] via-[#171d33] to-[#0f1424] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-premium-lg">
            <Scissors size={22} />
          </div>
          <h1 className="text-xl font-bold text-white">Barber Business Manager</h1>
          <p className="mt-1 text-sm text-white/50">Sign in to manage your business</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-premium-lg">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/30">
          Platform administrator?{" "}
          <a href="/admin/login" className="text-white/50 hover:text-white/80 hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
