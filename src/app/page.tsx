import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (session?.type === "user") redirect("/dashboard");
  if (session?.type === "admin") redirect("/admin");
  redirect("/login");
}
