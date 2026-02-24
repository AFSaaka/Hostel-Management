import { db } from "@/db";
import { rooms, occupancies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { AddRoomModal } from "@/components/AddRoomModal";
import { auth } from "@/auth";
import RoomGridClient from "@/components/RoomGridClient";

export default async function RoomsPage() {
  const session = await auth();
  const isSuperadmin = session?.user?.role === "superadmin";

  // Fetch all rooms with active occupancy counts
  const allRooms = await db
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      capacity: rooms.capacity,
      annualPrice: rooms.annualPrice,
      description: rooms.description,
      imageUrls: rooms.imageUrls,
      activeResidents: sql<number>`cast(count(${occupancies.id}) filter (where ${occupancies.endedAt} is null) as int)`,
    })
    .from(rooms)
    .leftJoin(occupancies, eq(rooms.id, occupancies.roomId))
    .groupBy(rooms.id)
    .orderBy(rooms.roomNumber);

  return (
    <div className="space-y-6 p-6 max-w-1600px mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Room Management
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Manage your inventory and monitor live occupancy levels.
          </p>
        </div>

        {/* Only Superadmins can add rooms per your system instructions */}
        <AddRoomModal />
      </div>

      {/* Main Grid Component 
          Handles searching, filtering, and the RoomGallery Lightbox 
      */}
      <RoomGridClient initialRooms={allRooms} isSuperadmin={isSuperadmin} />
    </div>
  );
}
