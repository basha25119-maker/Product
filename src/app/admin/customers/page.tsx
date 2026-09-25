import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { NewRecordPanel } from "@/components/ui/NewRecordPanel";
import { CreateCustomerForm } from "./CreateCustomerForm";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const statusTone = { ACTIVE: "success", SUSPENDED: "danger", INACTIVE: "muted" } as const;

export default async function AdminCustomersPage() {
  const admin = await requireAdminSession();
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: { where: { role: "OWNER" }, take: 1 }, subscription: true },
  });

  return (
    <AdminShell adminEmail={admin.email}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Every business tenant on the platform.</p>
        </div>
        <NewRecordPanel label="Create Customer">
          <CreateCustomerForm />
        </NewRecordPanel>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Business</Th>
            <Th>Owner</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Plan</Th>
            <Th>Created</Th>
          </tr>
        </Thead>
        <Tbody>
          {tenants.map((t) => (
            <Tr key={t.id}>
              <Td className="font-medium">
                <Link href={`/admin/customers/${t.id}`} className="hover:underline">
                  {t.name}
                </Link>
              </Td>
              <Td>{t.users[0]?.name ?? "-"}</Td>
              <Td className="text-muted-foreground">{t.email ?? t.users[0]?.email ?? "-"}</Td>
              <Td>
                <Badge tone={statusTone[t.status]}>{t.status}</Badge>
              </Td>
              <Td className="text-muted-foreground">{t.subscription?.plan ?? "-"}</Td>
              <Td className="text-muted-foreground">{formatDate(t.createdAt)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {tenants.length === 0 && <EmptyState title="No customers yet" description="Create your first customer account." />}
    </AdminShell>
  );
}
