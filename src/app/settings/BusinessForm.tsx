"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateBusinessProfileAction, type ActionState } from "@/actions/settings";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Business Details"}
    </Button>
  );
}

export function BusinessForm({
  tenant,
}: {
  tenant: { name: string; email: string | null; phone: string | null; address: string | null; currency: string; timezone: string };
}) {
  const [state, formAction] = useFormState(updateBusinessProfileAction as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="name">Business Name</Label>
          <Input id="name" name="name" defaultValue={tenant.name} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={tenant.email ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" name="currency" defaultValue={tenant.currency}>
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="timezone">Timezone</Label>
          <Select id="timezone" name="timezone" defaultValue={tenant.timezone}>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Dublin">Europe/Dublin</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
          </Select>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
        </FieldGroup>
      </div>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton />
    </form>
  );
}
