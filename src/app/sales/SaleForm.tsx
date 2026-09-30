"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { createSaleEntryAction, type ActionState } from "@/actions/sales";
import { Input, Label, FieldGroup, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { formatMoney } from "@/lib/utils";

type Branch = { id: string; name: string };
type Worker = { id: string; firstName: string; lastName: string; branchId: string | null };
type PaymentMethod = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Record Sale"}
    </Button>
  );
}

export function SaleForm({
  branches,
  workers,
  paymentMethods,
  currency = "GBP",
}: {
  branches: Branch[];
  workers: Worker[];
  paymentMethods: PaymentMethod[];
  currency?: string;
}) {
  const [state, formAction] = useFormState(
    createSaleEntryAction as (s: ActionState, f: FormData) => Promise<ActionState>,
    undefined
  );
  const [branchId, setBranchId] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const filteredWorkers = branchId ? workers.filter((w) => !w.branchId || w.branchId === branchId) : workers;
  const today = new Date().toISOString().slice(0, 10);

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [amounts]
  );

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
          <Select id="workerId" name="workerId" required>
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
          <Label htmlFor="reference">Reference (optional)</Label>
          <Input id="reference" name="reference" />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Amount by Payment Method</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paymentMethods.map((p) => (
            <div key={p.id}>
              <label htmlFor={`amount_${p.id}`} className="mb-1 block text-xs font-medium text-muted-foreground">
                {p.name}
              </label>
              <Input
                id={`amount_${p.id}`}
                name={`amount_${p.id}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amounts[p.id] ?? ""}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [p.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {paymentMethods.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active payment methods. Add one in Settings first.
          </p>
        )}
      </FieldGroup>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold">
        <span>Total</span>
        <span>{formatMoney(total, currency)}</span>
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
