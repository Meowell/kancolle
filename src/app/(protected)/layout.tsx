import { AppShell } from "@/components/common/app-shell";
import { requireCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  return <AppShell userName={user.name}>{children}</AppShell>;
}
