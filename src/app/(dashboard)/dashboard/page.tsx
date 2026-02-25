import { db } from "@/db";
import {
  residents,
  occupancies,
  rooms,
  payments,
  auditLogs,
  profiles,
} from "@/db/schema";
import { eq, sql, isNull, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import {
  Users,
  Bed,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Activity,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

/**
 * Helper to transform raw audit JSON into human-readable descriptions
 */
function formatAuditDescription(log: {
  action: string;
  entityType: string;
  oldData: string | null;
  newData: string | null;
}) {
  try {
    const next = log.newData ? JSON.parse(log.newData) : null;
    const prev = log.oldData ? JSON.parse(log.oldData) : null;

    // 1. Identify the subject name (Resident Name, Room Number, etc.)
    const subjectName = next?.name || next?.roomNumber || next?.fullName || "";
    const subjectLabel = subjectName ? `(${subjectName})` : "";

    switch (log.action) {
      case "CREATE":
        if (log.entityType === "payments") {
          return `recorded a Gh₵${Number(next.amount).toLocaleString()} ${next.method} payment for resident ID ${next.residentId.slice(0, 8)}`;
        }
        return `created ${log.entityType.slice(0, -1)} ${subjectLabel}`;

      case "UPDATE":
        // 2. Identify what actually changed
        let changes = "";
        if (prev && next) {
          const changedKeys = Object.keys(next).filter(
            (key) =>
              JSON.stringify(prev[key]) !== JSON.stringify(next[key]) &&
              !["updatedAt", "id"].includes(key),
          );

          if (changedKeys.length > 0) {
            changes = ` (changed: ${changedKeys.join(", ")})`;
          }
        }

        return `updated details for ${log.entityType.slice(0, -1)} ${subjectLabel}${changes}`;

      case "DELETE":
        const oldSubject = prev?.name || prev?.roomNumber || "record";
        return `deleted ${log.entityType.slice(0, -1)}: ${oldSubject}`;

      case "UPLOAD_RECEIPT":
        return `uploaded a new payment receipt for ${log.entityType}`;

      case "LOGIN":
        return `signed into the management system`;

      default:
        return `${log.action.toLowerCase()} on ${log.entityType} ${subjectLabel}`;
    }
  } catch (e) {
    return `${log.action.toLowerCase()} on ${log.entityType}`;
  }
}

export default async function DashboardHome() {
  const session = await auth();
  const currentYear = new Date().getFullYear();

  // 1. Fetch User Role for Permission Check (Using direct select to avoid Drizzle generic errors)
  const userProfiles = session?.user?.id
    ? await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, session.user.id))
        .limit(1)
    : [];

  const userProfile = userProfiles[0] || null;
  const isSuperAdmin = userProfile?.role === "superadmin";

  // 2. Fetch Metrics (Stats)
  const [stats] = await db
    .select({
      totalResidents: sql<number>`CAST(count(DISTINCT ${residents.id}) AS INT)`,
      totalCapacity: sql<number>`CAST(sum(${rooms.capacity}) AS INT)`,
      totalCollected: sql<string>`COALESCE(sum(${payments.amount}), '0')`,
      activeRevenue: sql<string>`COALESCE(sum(${occupancies.annualCharge}), '0')`,
      maxPotential: sql<string>`COALESCE(sum(${rooms.capacity} * ${rooms.annualPrice}), '0')`,
    })
    .from(rooms)
    .leftJoin(
      occupancies,
      and(eq(rooms.id, occupancies.roomId), isNull(occupancies.endedAt)),
    )
    .leftJoin(residents, eq(occupancies.residentId, residents.id))
    .leftJoin(payments, eq(occupancies.id, payments.occupancyId));

  // 3. Fetch Recent Payments
  const recentPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      residentName: residents.name,
      method: payments.method,
      paidAt: payments.paidAt,
    })
    .from(payments)
    .innerJoin(residents, eq(payments.residentId, residents.id))
    .orderBy(desc(payments.paidAt))
    .limit(5);

  // 4. Fetch Audit Logs (ONLY if Superadmin)
  const recentLogs = isSuperAdmin
    ? await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          actorName: profiles.fullName,
          createdAt: auditLogs.createdAt,
          entityType: auditLogs.entityType,
          oldData: auditLogs.oldData, // 🚀 ADD THIS
          newData: auditLogs.newData,
        })
        .from(auditLogs)
        .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5)
    : [];

  const occupancyRate =
    stats.totalCapacity > 0
      ? ((stats.totalResidents / stats.totalCapacity) * 100).toFixed(1)
      : "0";
  const emptyBedsCount = stats.totalCapacity - stats.totalResidents;
  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium">
            Hostel Performance Overview — {currentYear}
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> Superadmin Access
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Activity className="w-3 h-3" /> System Live
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${stats.totalResidents} Beds Occupied`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Revenue Collected"
          value={`₵${Number(stats.totalCollected).toLocaleString()}`}
          subtitle="Year-to-date"
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          title="Outstanding"
          value={`₵${(Number(stats.activeRevenue) - Number(stats.totalCollected)).toLocaleString()}`}
          subtitle="From active residents"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Vacancy Loss"
          value={`₵${(Number(stats.maxPotential) - Number(stats.activeRevenue)).toLocaleString()}`}
          // We add the dynamic bed count here
          subtitle={`${emptyBedsCount} Empty ${emptyBedsCount === 1 ? "Bed" : "Beds"} Available`}
          icon={<Bed className="w-5 h-5 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white rounded-4x1 border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900">Recent Payments</h3>
            <Link
              href="/dashboard/payments"
              className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-widest hover:underline"
            >
              Full Ledger <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-400 capitalize text-[10px] font-black">
                    {p.method}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {p.residentName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {new Date(p.paidAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                </div>
                <p className="font-black text-slate-900">
                  ₵{Number(p.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conditional Sidebar: Audit Logs OR Financial Health */}
        <div className="flex flex-col gap-6">
          {isSuperAdmin && (
            <div className="bg-white rounded-4x1 p-8 border border-slate-100 shadow-sm">
              <h3 className="font-black text-secondary mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" /> System
                Activity
              </h3>
              <div className="space-y-6">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="relative pl-6 border-l-2 border-slate-100 pb-1 last:pb-0"
                  >
                    <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-white border-2 border-secondary" />
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest leading-none mb-1">
                      {log.action.replace("_", " ")}
                    </p>
                    <p className="text-sm font-bold text-secondary leading-tight">
                      <span className="text-primary">
                        {log.actorName || "System"}
                      </span>{" "}
                      {formatAuditDescription(log as any)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-4x1 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2">Financial Health</h3>
              <p className="text-slate-400 text-sm mb-6">
                Collected{" "}
                {(
                  (Number(stats.totalCollected) / Number(stats.activeRevenue)) *
                    100 || 0
                ).toFixed(1)}
                % of assigned charges.
              </p>
              <div className="space-y-4">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{
                      width: `${(Number(stats.totalCollected) / Number(stats.activeRevenue)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Collection Progress
                </p>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[1.6rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="p-3 bg-slate-50 w-fit rounded-2xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}
