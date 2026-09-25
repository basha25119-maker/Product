"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatMoney } from "@/lib/utils";

const COLORS = ["#4c1d95", "#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function SixMonthChart({
  data,
  currency,
}: {
  data: { month: string; revenue: number; totalExpenses: number; netProfit: number }[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 92%)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 55%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 55%)" width={70} tickFormatter={(v) => formatMoney(v, currency)} />
        <Tooltip formatter={(v: number) => formatMoney(v, currency)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)" }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4c1d95" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="totalExpenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueExpenseBar({
  data,
  currency,
}: {
  data: { label: string; revenue: number; expenses: number }[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 92%)" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(220 10% 55%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 55%)" width={70} tickFormatter={(v) => formatMoney(v, currency)} />
        <Tooltip formatter={(v: number) => formatMoney(v, currency)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)" }} />
        <Bar dataKey="revenue" name="Revenue" fill="#4c1d95" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CashCardPie({ data, currency }: { data: { name: string; total: number }[]; currency: string }) {
  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No sales yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatMoney(v, currency)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
