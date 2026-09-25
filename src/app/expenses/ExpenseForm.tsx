"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createExpenseAction, type ActionState } from "@/actions/expenses";
import { Input, Label, FieldGroup, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

type Branch = { id: string; name: string };
type Category = { id: string; name: string };
type PaymentMethod = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Record Expense"}
    </Button>
  );
}

export function ExpenseForm({
  branches,
  categories,
  paymentMethods,
}: {
  branches: Branch[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [state, formAction] = useFormState(createExpenseAction as (s: ActionState, f: FormData) => Promise<ActionState>, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="branchId">Branch</Label>
          <Select id="branchId" name="branchId" required>
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
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
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
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
