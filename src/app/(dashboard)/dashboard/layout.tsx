import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Determine the display title based on role
  const dashboardTitle =
    session.user.role === "superadmin"
      ? "Superadmin Dashboard"
      : "Admin Dashboard";

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        user={{
          name: session.user.name,
          role: session.user.role as "superadmin" | "admin",
        }}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            {dashboardTitle}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary">
              Welcome, {session.user.name}
            </span>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
