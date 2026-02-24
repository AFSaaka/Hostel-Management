"use server";

import { db } from "@/db";
import { residents, occupancies, rooms } from "@/db/schema";
import { eq, and, isNull, sql, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * PRODUCTION HELPER: Validates if a room has space
 */
async function checkRoomAvailability(tx: any, roomId: string, excludeResidentId?: string) {
  const roomData = await tx
    .select({
      capacity: rooms.capacity,
      currentCount: sql<number>`count(${occupancies.id})`,
    })
    .from(rooms)
    .leftJoin(
      occupancies,
      and(
        eq(occupancies.roomId, rooms.id),
        isNull(occupancies.endedAt),
        excludeResidentId ? ne(occupancies.residentId, excludeResidentId) : undefined
      )
    )
    .where(eq(rooms.id, roomId))
    .groupBy(rooms.id);

  if (!roomData[0]) return { allowed: false, error: "Room not found." };
  if (roomData[0].currentCount >= roomData[0].capacity) {
    return { allowed: false, error: "This room is already at full capacity." };
  }
  return { allowed: true };
}

export async function createResident(formData: FormData) {
  const session = await auth();
  // 1. Production check: actor ID is mandatory for audit trail
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const photoUrl = formData.get("photoUrl") as string;
  const roomId = formData.get("roomId") as string;
  const annualChargeStr = formData.get("annualCharge") as string;
  const year = new Date().getFullYear();

  if (!name || !phone || !roomId) {
    return { success: false, error: "Name, phone, and room are required." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const availability = await checkRoomAvailability(tx, roomId);
      if (!availability.allowed) throw new Error(availability.error);

      // 2. Insert Resident and get back the full object
      const [newResident] = await tx
        .insert(residents)
        .values({
          name,
          phone,
          photoUrl: photoUrl && photoUrl !== "null" ? photoUrl : null,
          status: "active",
        })
        .returning();

      const charge = parseFloat(annualChargeStr) || 0;
      const [newOccupancy] = await tx
        .insert(occupancies)
        .values({
          residentId: newResident.id,
          roomId: roomId,
          year: year,
          annualCharge: charge.toString(),
        })
        .returning();

      // 3. Log the creation with full context
      await createAuditLog({
        actorId: session.user.id,
        action: "CREATE",
        entityType: "residents",
        entityId: newResident.id,
        newData: { ...newResident, annualCharge: newOccupancy.annualCharge, roomId: newOccupancy.roomId },
      });

      return newResident;
    });

    revalidatePath("/dashboard/residents");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }
}

export async function updateResident(formData: FormData, residentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const photoUrl = formData.get("photoUrl") as string;
  const newRoomId = formData.get("roomId") as string;
  const newCharge = parseFloat(formData.get("annualCharge") as string).toFixed(2);
  const currentYear = new Date().getFullYear();

  try {
    await db.transaction(async (tx) => {
      const availability = await checkRoomAvailability(tx, newRoomId, residentId);
      if (!availability.allowed) throw new Error(availability.error);

      // 1. Fetch current state before update
      const [oldResident] = await tx.select().from(residents).where(eq(residents.id, residentId)).limit(1);
      const [oldOccupancy] = await tx.select().from(occupancies).where(and(eq(occupancies.residentId, residentId), eq(occupancies.year, currentYear))).limit(1);

      // 2. Perform Updates
      const [updatedResident] = await tx
        .update(residents)
        .set({
          name,
          phone,
          photoUrl: photoUrl && photoUrl !== "null" ? photoUrl : null,
        })
        .where(eq(residents.id, residentId))
        .returning();

      let updatedOccupancy;
      if (oldOccupancy) {
        [updatedOccupancy] = await tx
          .update(occupancies)
          .set({ roomId: newRoomId, annualCharge: newCharge, endedAt: null })
          .where(eq(occupancies.id, oldOccupancy.id))
          .returning();
      } else {
        [updatedOccupancy] = await tx
          .insert(occupancies)
          .values({ residentId, roomId: newRoomId, year: currentYear, annualCharge: newCharge })
          .returning();
      }

      // 3. Log the update with the "old vs new" snapshot
      await createAuditLog({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "residents",
        entityId: residentId,
        oldData: { ...oldResident, roomId: oldOccupancy?.roomId, charge: oldOccupancy?.annualCharge },
        newData: { ...updatedResident, roomId: updatedOccupancy.roomId, charge: updatedOccupancy.annualCharge },
      });
    });

    revalidatePath("/dashboard/residents");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Update failed" };
  }
}

export async function deleteResident(id: string) {
  const session = await auth();

  // Security Guard: Only superadmins can delete
  if (session?.user?.role !== "superadmin") {
    return { success: false, error: "Unauthorized: Only superadmins can delete residents." };
  }

  try {
    // 1. Snapshot the resident before they are gone
    const [residentToDelete] = await db.select().from(residents).where(eq(residents.id, id)).limit(1);
    if (!residentToDelete) return { success: false, error: "Resident not found" };

    // 2. Perform deletion
    await db.delete(residents).where(eq(residents.id, id));

    // 3. Log the deletion
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "residents",
      entityId: id,
      oldData: residentToDelete,
    });

    revalidatePath("/dashboard/residents");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete resident. They may have payment history." };
  }
}