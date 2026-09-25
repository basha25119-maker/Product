import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1424] via-[#171d33] to-[#0f1424] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-white/50">We'll help you get back in.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-premium-lg">
          <ForgotForm />
        </div>
      </div>
    </div>
  );
}
