import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
} from "date-fns";

export function resolveRange(range: string | undefined): { from?: Date; to?: Date } {
  const now = new Date();
  switch (range) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "this_week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "last_month": {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "all":
      return {};
    case "this_month":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}
