"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "@/actions/password";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );
}

export function ForgotForm() {
  const [state, formAction] = useFormState(requestPasswordResetAction, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </FieldGroup>
      {state?.error && <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}
          {state.resetLink && (
            <>
              {" "}
              <Link href={state.resetLink} className="underline">
                Open reset link
              </Link>
            </>
          )}
        </div>
      )}
      <SubmitButton />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
