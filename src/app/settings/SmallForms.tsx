"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPaymentMethodAction, togglePaymentMethodAction, type ActionState as PmState } from "@/actions/settings";
import { createExpenseCategoryAction, type ActionState as CatState } from "@/actions/expenses";
import { changePasswordAction, type ActionState as PwState } from "@/actions/password";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

function SubmitMini({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "..." : label}
    </Button>
  );
}

export function AddPaymentMethodForm() {
  const [state, formAction] = useFormState(createPaymentMethodAction as (s: PmState, f: FormData) => Promise<PmState>, undefined);
  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <Input name="name" placeholder="e.g. Bank Transfer" required />
        <SubmitMini label="Add" />
      </div>
      <FormMessage error={state?.error} success={state?.success} />
    </form>
  );
}

export function AddCategoryForm() {
  const [state, formAction] = useFormState(createExpenseCategoryAction as (s: CatState, f: FormData) => Promise<CatState>, undefined);
  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <Input name="name" placeholder="e.g. Marketing" required />
        <SubmitMini label="Add" />
      </div>
      <FormMessage error={state?.error} success={state?.success} />
    </form>
  );
}

export function PaymentMethodRow({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
      <span>{name}</span>
      <div className="flex items-center gap-3">
        <Badge tone={isActive ? "success" : "muted"}>{isActive ? "Active" : "Disabled"}</Badge>
        <ConfirmButton
          action={togglePaymentMethodAction.bind(null, id, !isActive)}
          confirmText={isActive ? `Disable ${name}?` : `Enable ${name}?`}
          className="text-accent hover:underline"
        >
          {isActive ? "Disable" : "Enable"}
        </ConfirmButton>
      </div>
    </li>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction as (s: PwState, f: FormData) => Promise<PwState>, undefined);
  return (
    <form action={formAction} className="max-w-sm">
      <FieldGroup>
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirm">Confirm New Password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} />
      </FieldGroup>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitMini label="Update Password" />
    </form>
  );
}
