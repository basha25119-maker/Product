"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminLoginAction } from "@/actions/auth";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(adminLoginAction, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Label htmlFor="email">Admin Email</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </FieldGroup>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
