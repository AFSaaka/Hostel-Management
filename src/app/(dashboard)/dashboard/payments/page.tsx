import { db } from "@/db";
import { residents, occupancies, payments, rooms } from "@/db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";
import { CheckCircle2, Clock, Users, Home } from "lucide-react";
import { RecordPaymentModal } from "@/components/RecordPaymentModal";
import { PaymentsTable } from "@/components/PaymentsTable";

export default async function PaymentsPage() {
  const currentYear = new Date().getFullYear();

  // 1. Potential Revenue
  const [potentialRev] = await db
    .select({
      total: sql<string>`SUM(${rooms.capacity} * ${rooms.annualPrice})`,
    })
    .from(rooms);

  // 2. Financial Data with JSON Aggregated Payment History
  const rawFinancialData = await db
    .select({
      residentId: residents.id,
      occupancyId: occupancies.id,
      name: residents.name,
      roomNumber: rooms.roomNumber,
      annualCharge: occupancies.annualCharge,
      totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      balance: sql<string>`(${occupancies.annualCharge} - COALESCE(SUM(${payments.amount}), 0))`,
      paymentHistory: sql<string>`
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ${payments.id},
              'amount', ${payments.amount},
              'method', ${payments.method},
              'receiptUrl', ${payments.receiptUrl},
              'paidAt', ${payments.paidAt}
            ) ORDER BY ${payments.paidAt} DESC
          ) FILTER (WHERE ${payments.id} IS NOT NULL),
          '[]'
        )
      `,
    })
    .from(residents)
    .innerJoin(
      occupancies,
      and(
        eq(residents.id, occupancies.residentId),
        eq(occupancies.year, currentYear),
        isNull(occupancies.endedAt),
      ),
    )
    .innerJoin(rooms, eq(occupancies.roomId, rooms.id))
    .leftJoin(payments, eq(occupancies.id, payments.occupancyId))
    .groupBy(
      residents.id,
      residents.name,
      rooms.roomNumber,
      occupancies.annualCharge,
      occupancies.id,
    )
    .orderBy(rooms.roomNumber);

  // 3. Transform Data: Parse the JSON string from Postgres into a JS Array
  const financialData = rawFinancialData.map((item) => ({
    ...item,
    paymentHistory:
      typeof item.paymentHistory === "string"
        ? JSON.parse(item.paymentHistory)
        : item.paymentHistory,
  }));

  const totalCollected = financialData.reduce(
    (acc, curr) => acc + parseFloat(curr.totalPaid),
    0,
  );
  const totalPotential = parseFloat(potentialRev.total || "0");
  const occupancyChargeTotal = financialData.reduce(
    (acc, curr) => acc + parseFloat(curr.annualCharge),
    0,
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 p-6 overflow-hidden bg-slate-50/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          title="Potential Revenue"
          value={totalPotential}
          subtitle="Full capacity"
          icon={<Home className="w-5 h-5" />}
        />
        <MetricCard
          title="Total Collected"
          value={totalCollected}
          variant="success"
          subtitle={`${((totalCollected / (totalPotential || 1)) * 100).toFixed(1)}% efficiency`}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <MetricCard
          title="Outstanding"
          value={occupancyChargeTotal - totalCollected}
          variant="warning"
          subtitle="Unpaid from assigned"
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          title="Vacancy Loss"
          value={totalPotential - occupancyChargeTotal}
          subtitle="Lost from empty beds"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <PaymentsTable data={financialData}>
        <RecordPaymentModal residents={financialData} />
      </PaymentsTable>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: any) {
  const colors = {
    default: "text-slate-900",
    success: "text-green-600",
    warning: "text-amber-600",
  };
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-50 rounded-xl text-slate-400">{icon}</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </p>
      </div>
      <h3
        className={`text-xl font-black ${colors[variant as keyof typeof colors]}`}
      >
        Gh₵{value.toLocaleString()}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}
