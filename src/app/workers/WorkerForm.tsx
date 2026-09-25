"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createWorkerAction, updateWorkerAction, type ActionState } from "@/actions/workers";
import { Input, Label, FieldGroup, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { usePanelClose } from "@/components/ui/PanelContext";

type Branch = { id: string; name: string };
type Worker = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  branchId: string | null;
  phone: string | null;
  email: string | null;
  wageType: string;
  defaultWageAmount: string | null;
  notes: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function WorkerForm({ branches, worker }: { branches: Branch[]; worker?: Worker }) {
  const action = worker ? updateWorkerAction.bind(null, worker.id) : createWorkerAction;
  const [state, formAction] = useFormState(action as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);
  const close = usePanelClose();

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" defaultValue={worker?.firstName} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" defaultValue={worker?.lastName} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="branchId">Branch</Label>
          <Select id="branchId" name="branchId" defaultValue={worker?.branchId ?? ""}>
            <option value="">Unassigned</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={worker?.phone ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={worker?.email ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="wageType">Wage Type</Label>
          <Select id="wageType" name="wageType" defaultValue={worker?.wageType ?? "COMMISSION"}>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="COMMISSION">Commission</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="defaultWageAmount">Default Wage Amount</Label>
          <Input id="defaultWageAmount" name="defaultWageAmount" type="number" step="0.01" defaultValue={worker?.defaultWageAmount ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="date" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={worker?.notes ?? ""} />
      </FieldGroup>
      <FormMessage error={state?.error} success={state?.success} />
      <div className="flex gap-2">
        <SubmitButton label={worker ? "Save Changes" : "Add Worker"} />
        {close && (
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
