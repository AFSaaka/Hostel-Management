import { auth } from "@/auth";
import { db } from "@/db";
import { appUsers, profiles } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ShieldCheck, Mail, User, Trash2 } from "lucide-react";
import { deleteAdmin } from "@/app/actions/admin";
import { ConfirmAction } from "@/components/ConfirmAction";
import { AddAdminModal } from "@/components/AddAdminModal";
import { EditAdminModal } from "@/components/EditAdminModal";

export default async function AdminManagementPage() {
  const session = await auth();

  // Hard security check
  if (session?.user?.role !== "superadmin") {
    redirect("/dashboard");
  }

  const admins = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      fullName: profiles.fullName,
      role: profiles.role,
    })
    .from(appUsers)
    .leftJoin(profiles, eq(profiles.id, appUsers.id))
    .where(
      and(
        eq(profiles.role, "admin"),
        ne(appUsers.id, session.user.id), // Don't show yourself in the list
      ),
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Management
          </h1>
          <p className="text-secondary text-sm">
            Create and manage coordinator accounts.
          </p>
        </div>
        <AddAdminModal />
      </div>

      <div className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                Administrator
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-slate-400 italic"
                >
                  No other administrators registered yet.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="group hover:bg-surface/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {admin.fullName?.charAt(0) || (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {admin.fullName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary border border-blue-100">
                      <ShieldCheck className="w-3 h-3" />
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center">
                      <EditAdminModal
                        admin={{
                          id: admin.id,
                          fullName: admin.fullName,
                          email: admin.email,
                        }}
                      />
                      {/* We'll add Delete action next */}
                      <ConfirmAction
                        title="Delete Admin?"
                        onConfirm={async () => {
                          "use server"; // This allows passing the action directly in some setups
                          await deleteAdmin(admin.id);
                        }}
                        actionTrigger={
                          <button className="text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
