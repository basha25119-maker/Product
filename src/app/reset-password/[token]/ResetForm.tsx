"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPasswordAction, type ActionState } from "@/actions/password";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Saving..." : "Set New Password"}
    </Button>
  );
}

export function ResetForm({ token }: { token: string }) {
  const action = resetPasswordAction.bind(null, token) as (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirm">Confirm Password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} />
      </FieldGroup>
      {state?.error && <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
