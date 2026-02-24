"use server";

import { db } from "@/db";
import { profiles, appUsers, systemSettings, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

/**
 * Update Profile: Changes the user's display name.
 */
export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const fullName = formData.get("fullName") as string;
  const userId = session.user.id;

  try {
    const [currentProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    await db
      .update(profiles)
      .set({ fullName })
      .where(eq(profiles.id, userId));

    await createAuditLog({
      actorId: userId,
      action: "UPDATE",
      entityType: "profiles",
      entityId: userId,
      oldData: currentProfile,
      newData: { fullName },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Update Password: Hashes new password with 12 salt rounds.
 */
export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const password = formData.get("password") as string;
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await db
      .update(appUsers)
      .set({ passwordHash: hashedPassword })
      .where(eq(appUsers.id, session.user.id));

    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "app_users",
      entityId: session.user.id,
      newData: { event: "PASSWORD_CHANGED" },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Password update failed" };
  }
}

/**
 * Update System Identity: Updates Hostel Name/Logo
 * THIS WAS THE MISSING EXPORT
 */
export async function updateSystemIdentity(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return { success: false, error: "Unauthorized" };

  const hostelName = formData.get("hostelName") as string;
  const logoUrl = formData.get("logoUrl") as string; // Placeholder for now

  try {
    const [current] = await db.select().from(systemSettings).limit(1);

    if (!current) {
      await db.insert(systemSettings).values({ hostelName, logoUrl });
    } else {
      await db.update(systemSettings)
        .set({ hostelName, logoUrl, updatedAt: new Date() })
        .where(eq(systemSettings.id, current.id));
    }

    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "system_settings",
      newData: { hostelName, logoUrl },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update identity" };
  }
}

/**
 * Maintenance Mode: Toggles the global lockdown flag.
 */
export async function toggleMaintenanceMode() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return { success: false, error: "Forbidden" };

  try {
    const [current] = await db.select().from(systemSettings).limit(1);
    
    if (!current) {
      await db.insert(systemSettings).values({ isMaintenanceMode: 1 });
      return { success: true, enabled: true };
    }

    const nextValue = current.isMaintenanceMode === 1 ? 0 : 1;
    await db.update(systemSettings).set({ isMaintenanceMode: nextValue });

    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "system_settings",
      newData: { isMaintenanceMode: nextValue },
    });

    revalidatePath("/", "layout");
    return { success: true, enabled: nextValue === 1 };
  } catch (error) {
    return { success: false, error: "Failed to toggle maintenance mode" };
  }
}

/**
 * Update Admin Role: Promotes/Demotes admins.
 */
export async function updateAdminRole(targetId: string, newRole: "admin" | "superadmin") {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return { success: false, error: "Forbidden" };
  if (targetId === session.user.id) return { success: false, error: "You cannot change your own role" };

  try {
    await db.update(profiles).set({ role: newRole }).where(eq(profiles.id, targetId));
    
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "profiles",
      entityId: targetId,
      newData: { role: newRole },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Role update failed" };
  }
}

export async function getAllAdmins() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") throw new Error("Unauthorized");

  // Join profiles with appUsers to get emails and roles
  return await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      email: appUsers.email,
    })
    .from(profiles)
    .innerJoin(appUsers, eq(profiles.id, appUsers.id));
}
/**
 * Global Audit Log Viewer
 * Switched to Standard Syntax to avoid index.ts issues
 */
export async function getAuditLogs(limitCount = 50) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") throw new Error("Unauthorized");

  // Use this standard syntax instead of .query
  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limitCount);
}