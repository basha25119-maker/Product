"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createBranchAction, updateBranchAction, type ActionState } from "@/actions/branches";
import { Input, Label, FieldGroup, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { usePanelClose } from "@/components/ui/PanelContext";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function BranchForm({
  branch,
}: {
  branch?: { id: string; name: string; address: string | null; phone: string | null; email: string | null; notes: string | null };
}) {
  const action = branch ? updateBranchAction.bind(null, branch.id) : createBranchAction;
  const [state, formAction] = useFormState(action as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);
  const close = usePanelClose();

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="name">Branch Name</Label>
          <Input id="name" name="name" defaultValue={branch?.name} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={branch?.phone ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={branch?.email ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="openingDate">Opening Date</Label>
          <Input id="openingDate" name="openingDate" type="date" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={branch?.address ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={branch?.notes ?? ""} />
      </FieldGroup>
      <FormMessage error={state?.error} success={state?.success} />
      <div className="flex gap-2">
        <SubmitButton label={branch ? "Save Changes" : "Add Branch"} />
        {close && (
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
