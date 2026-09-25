"use client";

import { useState, useTransition } from "react";
import { adminResetPasswordAction } from "@/actions/admin";
import { Button } from "@/components/ui/Button";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Reset this user's password? A new temporary password will be generated.")) return;
          startTransition(async () => {
            const res = await adminResetPasswordAction(userId);
            setTempPassword(res.tempPassword);
          });
        }}
      >
        {pending ? "Resetting..." : "Reset Password"}
      </Button>
      {tempPassword && (
        <p className="mt-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
          New temporary password: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{tempPassword}</code>
        </p>
      )}
    </div>
  );
}
