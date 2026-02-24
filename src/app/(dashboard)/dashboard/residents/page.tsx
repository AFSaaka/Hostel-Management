import { db } from "@/db";
import { residents, occupancies, rooms, payments } from "@/db/schema";
import { eq, isNull, sql, and } from "drizzle-orm";
import { auth } from "@/auth";
import { AddResidentModal } from "@/components/AddResidentModal";
import { ResidentsTable } from "@/components/ResidentsTable";

export default async function ResidentsPage() {
  const session = await auth();
  const isSuperadmin = session?.user?.role === "superadmin";

  // 1. Fetch Residents with Financial Totals and Payment History JSON
  const residentList = await db
    .select({
      id: residents.id,
      name: residents.name,
      phone: residents.phone,
      status: residents.status,
      photoUrl: residents.photoUrl,
      roomNumber: rooms.roomNumber,
      roomId: rooms.id,
      annualCharge: occupancies.annualCharge,
      assignedAt: occupancies.assignedAt,
      totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      balance: sql<string>`(${occupancies.annualCharge} - COALESCE(SUM(${payments.amount}), 0))`,
      // Aggregates payment history into a JSON string
      paymentHistory: sql<string>`
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ${payments.id},
              'amount', ${payments.amount},
              'method', ${payments.method},
              'receiptUrl', ${payments.receiptUrl},
              'createdAt', ${payments.paidAt}
            )
          ) FILTER (WHERE ${payments.id} IS NOT NULL),
          '[]'
        )
      `,
    })
    .from(residents)
    .leftJoin(
      occupancies,
      and(
        eq(residents.id, occupancies.residentId),
        isNull(occupancies.endedAt),
      ),
    )
    .leftJoin(rooms, eq(occupancies.roomId, rooms.id))
    .leftJoin(payments, eq(occupancies.id, payments.occupancyId))
    .groupBy(
      residents.id,
      rooms.roomNumber,
      rooms.id,
      occupancies.annualCharge,
      occupancies.assignedAt,
    )
    .orderBy(residents.name);

  // 2. Fetch Rooms with live occupancy counts
  const allRooms = await db
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      capacity: rooms.capacity,
      annualPrice: rooms.annualPrice,
      residentsCount: sql<number>`cast(count(${occupancies.id}) as int)`,
    })
    .from(rooms)
    .leftJoin(
      occupancies,
      and(eq(rooms.id, occupancies.roomId), isNull(occupancies.endedAt)),
    )
    .groupBy(rooms.id)
    .orderBy(rooms.roomNumber);

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Residents
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Reviewing {residentList.length} active occupancies and financial
            status.
          </p>
        </div>
        <AddResidentModal rooms={allRooms as any} />
      </div>

      <ResidentsTable
        initialData={residentList}
        isSuperadmin={isSuperadmin}
        allRooms={allRooms as any}
      />
    </div>
  );
}
