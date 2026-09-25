import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BranchForm } from "../branches/BranchForm";
import { WorkerForm } from "../workers/WorkerForm";
import { AddPaymentMethodForm, AddCategoryForm } from "../settings/SmallForms";
import { completeOnboardingAction } from "@/actions/onboarding";
import { CheckCircle2, Scissors } from "lucide-react";

export default async function OnboardingPage() {
  const session = await requireUserSession();
  const [tenant, branches, paymentMethods, categories] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId } }),
    prisma.paymentMethod.findMany({ where: { tenantId: session.tenantId } }),
    prisma.expenseCategory.findMany({ where: { OR: [{ tenantId: session.tenantId }, { isGlobalDefault: true }] } }),
  ]);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Scissors size={22} />
          </div>
          <h1 className="text-2xl font-bold">Welcome to {tenant?.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's get your workspace set up. You can skip steps and finish them later.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                1. Add Your Branches {branches.length > 0 && <CheckCircle2 className="ml-1 inline text-success" size={16} />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BranchForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Add Your Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkerForm branches={branches} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Cash and Card/Machine are already set up. Add any extra methods you use.
              </p>
              <ul className="mb-4 flex flex-wrap gap-2">
                {paymentMethods.map((p) => (
                  <li key={p.id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {p.name}
                  </li>
                ))}
              </ul>
              <AddPaymentMethodForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="mb-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {c.name}
                  </li>
                ))}
              </ul>
              <AddCategoryForm />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <form action={completeOnboardingAction}>
              <Button size="lg" type="submit">
                Finish Setup &amp; Go to Dashboard
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
