"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createSaleAction, updateSaleAction, type ActionState } from "@/actions/sales";
import { Input, Label, FieldGroup, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

type Branch = { id: string; name: string };
type Worker = { id: string; firstName: string; lastName: string; branchId: string | null };
type PaymentMethod = { id: string; name: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function SaleForm({
  branches,
  workers,
  paymentMethods,
  sale,
}: {
  branches: Branch[];
  workers: Worker[];
  paymentMethods: PaymentMethod[];
  sale?: {
    id: string;
    branchId: string;
    workerId: string;
    date: Date;
    amount: string;
    paymentMethodId: string;
    reference: string | null;
    notes: string | null;
  };
}) {
  const action = sale ? updateSaleAction.bind(null, sale.id) : createSaleAction;
  const [state, formAction] = useFormState(action as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);
  const [branchId, setBranchId] = useState(sale?.branchId ?? "");
  const filteredWorkers = branchId ? workers.filter((w) => !w.branchId || w.branchId === branchId) : workers;

  const today = new Date().toISOString().slice(0, 10);
  const dateDefault = sale ? new Date(sale.date).toISOString().slice(0, 10) : today;

  return (
    <form action={formAction}>
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
          <Select id="workerId" name="workerId" defaultValue={sale?.workerId ?? ""} required>
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
          <Input id="date" name="date" type="date" defaultValue={dateDefault} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={sale?.amount} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="paymentMethodId">Payment Method</Label>
          <Select id="paymentMethodId" name="paymentMethodId" defaultValue={sale?.paymentMethodId ?? ""} required>
            <option value="">Select method</option>
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="reference">Reference (optional)</Label>
          <Input id="reference" name="reference" defaultValue={sale?.reference ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={sale?.notes ?? ""} />
      </FieldGroup>
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton label={sale ? "Save Changes" : "Record Sale"} />
    </form>
  );
}
