"use client";

import { useFormState, useFormStatus } from "react-dom";
import { customerLoginAction } from "@/actions/auth";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(customerLoginAction, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@yourbusiness.com" required autoFocus />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </FieldGroup>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <SubmitButton />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
