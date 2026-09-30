"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createWageAction, type ActionState } from "@/actions/wages";
import { Input, Label, FieldGroup, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

type Branch = { id: string; name: string };
type Worker = { id: string; firstName: string; lastName: string; branchId: string | null };
type PaymentMethod = { id: string; name: string };
type Prefill = {
  workerId?: string;
  branchId?: string;
  amount?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Record Wage Payment"}
    </Button>
  );
}

export function WageForm({
  branches,
  workers,
  paymentMethods,
  prefill,
}: {
  branches: Branch[];
  workers: Worker[];
  paymentMethods: PaymentMethod[];
  prefill?: Prefill;
}) {
  const [state, formAction] = useFormState(createWageAction as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);
  const [branchId, setBranchId] = useState(prefill?.branchId ?? "");
  const filteredWorkers = branchId ? workers.filter((w) => !w.branchId || w.branchId === branchId) : workers;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction}>
      {prefill?.amount && (
        <p className="mb-4 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          Amount and pay period pre-filled from this worker's attendance for the selected month — adjust if needed.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="branchId">Branch</Label>
          <Select id="branchId" name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="workerId">Worker</Label>
          <Select id="workerId" name="workerId" defaultValue={prefill?.workerId ?? ""} required>
            <option value="">Select worker</option>
            {filteredWorkers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.firstName} {w.lastName}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={prefill?.amount} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="paymentMethodId">Payment Method</Label>
          <Select id="paymentMethodId" name="paymentMethodId">
            <option value="">Select method</option>
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="payPeriodStart">Pay Period Start</Label>
          <Input id="payPeriodStart" name="payPeriodStart" type="date" defaultValue={prefill?.payPeriodStart} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="payPeriodEnd">Pay Period End</Label>
          <Input id="payPeriodEnd" name="payPeriodEnd" type="date" defaultValue={prefill?.payPeriodEnd} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </FieldGroup>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton />
    </form>
  );
}
