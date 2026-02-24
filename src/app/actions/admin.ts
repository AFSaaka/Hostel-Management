"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appUsers, profiles } from "@/db/schema";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

export async function createAdmin(formData: FormData) {
  const session = await auth();
  
  // 1. Production security: verify the actor is a superadmin
  if (session?.user?.role !== "superadmin" || !session?.user?.id) {
    throw new Error("Only superadmins can perform this action.");
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const password = formData.get("password") as string;

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    return await db.transaction(async (tx) => {
      // 2. Standard ACID Transaction
      const [newUser] = await tx.insert(appUsers).values({
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
      }).returning({ id: appUsers.id, email: appUsers.email });

      const [newProfile] = await tx.insert(profiles).values({
        id: newUser.id,
        fullName,
        role: "admin",
      }).returning();

      // 3. Log the creation (Exclude sensitive password hash!)
      await createAuditLog({
        actorId: session.user.id,
        action: "CREATE",
        entityType: "profiles",
        entityId: newUser.id,
        newData: { 
          email: newUser.email, 
          fullName: newProfile.fullName, 
          role: newProfile.role 
        },
      });

      revalidatePath("/dashboard/admin-management");
      return { success: true };
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error("A user with this email already exists.");
    }
    throw new Error("Critical error during admin creation.");
  }
}

export async function updateAdmin(userId: string, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "superadmin" || !session?.user?.id) throw new Error("Unauthorized");

  const fullName = formData.get("fullName") as string;

  try {
    return await db.transaction(async (tx) => {
      // 1. Get current state
      const [oldProfile] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (!oldProfile) throw new Error("Admin not found");

      // 2. Update
      const [updatedProfile] = await tx.update(profiles)
        .set({ fullName })
        .where(eq(profiles.id, userId))
        .returning();

      // 3. Log the change
      await createAuditLog({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "profiles",
        entityId: userId,
        oldData: { fullName: oldProfile.fullName },
        newData: { fullName: updatedProfile.fullName },
      });

      revalidatePath("/dashboard/admin-management");
      return { success: true };
    });
  } catch (error) {
    throw new Error("Failed to update admin.");
  }
}

export async function deleteAdmin(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "superadmin" || !session?.user?.id) throw new Error("Unauthorized");

  try {
    return await db.transaction(async (tx) => {
      // 1. Snapshot the profile and user metadata before deletion
      const [profileToDelete] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (!profileToDelete) throw new Error("Admin not found");

      // 2. Perform deletion
      await tx.delete(profiles).where(eq(profiles.id, userId));
      await tx.delete(appUsers).where(eq(appUsers.id, userId));

      // 3. Log the deletion
      await createAuditLog({
        actorId: session.user.id,
        action: "DELETE",
        entityType: "profiles",
        entityId: userId,
        oldData: { email: session.user.email, fullName: profileToDelete.fullName },
      });

      revalidatePath("/dashboard/admin-management");
      return { success: true };
    });
  } catch (error) {
    console.error("DELETE_ADMIN_ERROR:", error);
    throw new Error("Failed to remove admin.");
  }
}