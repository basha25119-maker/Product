import { ResetForm } from "./ResetForm";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1424] via-[#171d33] to-[#0f1424] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-white">Set a new password</h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-premium-lg">
          <ResetForm token={params.token} />
        </div>
      </div>
    </div>
  );
}
