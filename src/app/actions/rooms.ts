"use server";

import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";


export async function createRoom(formData: FormData) {
  const session = await auth();
  // 1. Production guard: Check both session and specific roles
  if (!session?.user?.id || (session.user?.role !== "superadmin" && session.user?.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const roomNumber = formData.get("roomNumber") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const annualPrice = formData.get("annualPrice") as string;
  const description = formData.get("description") as string;
  const imageUrls = formData.get("imageUrls")?.toString().split(",").filter(Boolean) || [];

  if (!roomNumber || isNaN(capacity) || !annualPrice) {
    throw new Error("Missing or invalid required fields.");
  }

  try {
    return await db.transaction(async (tx) => {
      // 2. Perform insert and get the new record
      const [newRoom] = await tx.insert(rooms).values({
        roomNumber,
        capacity,
        annualPrice,
        description,
        imageUrls,
      }).returning();

      // 3. Log the creation
      await createAuditLog({
        actorId: session.user.id,
        action: "CREATE",
        entityType: "rooms",
        entityId: newRoom.id,
        newData: newRoom,
      });

      revalidatePath("/dashboard/rooms");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error: any) {
    if (error.code === '23505') throw new Error("Room number already exists.");
    console.error("CREATE_ROOM_ERROR:", error);
    throw new Error("Failed to create room.");
  }
}

export async function updateRoom(roomId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || (session.user?.role !== "superadmin" && session.user?.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const roomNumber = formData.get("roomNumber") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const annualPrice = formData.get("annualPrice") as string;
  const description = formData.get("description") as string;
  const imageUrls = formData.get("imageUrls")?.toString().split(",").filter(Boolean) || [];

  if (!roomId || !roomNumber || isNaN(capacity)) {
    throw new Error("Invalid update data.");
  }

  try {
    return await db.transaction(async (tx) => {
      // 1. Get current state for "Old Data"
      const [oldRoom] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (!oldRoom) throw new Error("Room not found");

      // 2. Update and get "New Data"
      const [updatedRoom] = await tx.update(rooms)
        .set({ 
          roomNumber, 
          capacity, 
          annualPrice, 
          description, 
          imageUrls 
        })
        .where(eq(rooms.id, roomId))
        .returning();

      // 3. Log the diff
      await createAuditLog({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "rooms",
        entityId: roomId,
        oldData: oldRoom,
        newData: updatedRoom,
      });

      revalidatePath("/dashboard/rooms");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error: any) {
    console.error("UPDATE_ROOM_ERROR:", error);
    throw new Error("Failed to update room.");
  }
}

export async function deleteRoom(roomId: string) {
  const session = await auth();
  // 1. Strict superadmin check for deletion
  if (session?.user?.role !== "superadmin") {
    throw new Error("Unauthorized. Only superadmins can delete rooms.");
  }

  try {
    return await db.transaction(async (tx) => {
      // 2. Snapshot before deletion
      const [roomToDelete] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (!roomToDelete) throw new Error("Room not found");

      // 3. Perform delete
      await tx.delete(rooms).where(eq(rooms.id, roomId));

      // 4. Log the deletion
      await createAuditLog({
        actorId: session.user.id as string,
        action: "DELETE",
        entityType: "rooms",
        entityId: roomId,
        oldData: roomToDelete,
      });

      revalidatePath("/dashboard/rooms");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error: any) {
    console.error("DELETE_ROOM_ERROR:", error);
    // Suggestion: Mention that the room might have active residents (FK constraint)
    throw new Error("Failed to delete room. Check if it still has active residents.");
  }
}