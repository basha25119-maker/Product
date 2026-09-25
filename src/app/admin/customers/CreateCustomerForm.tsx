"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createCustomerAction, type ActionState } from "@/actions/admin";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Account"}
    </Button>
  );
}

export function CreateCustomerForm() {
  const [state, formAction] = useFormState(createCustomerAction as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" name="businessName" required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input id="ownerName" name="ownerName" required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="plan">Plan</Label>
          <Select id="plan" name="plan" defaultValue="STARTER">
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="BUSINESS">Business</option>
          </Select>
        </FieldGroup>
      </div>
      <FormMessage error={state?.error} success={state?.success} />
      {state?.tempPassword && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
          Temporary password (share securely with the customer, they'll be asked to change it):{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{state.tempPassword}</code>
        </div>
      )}
      <SubmitButton />
    </form>
  );
}
