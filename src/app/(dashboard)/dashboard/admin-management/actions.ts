"use server";

import { db } from "@/db";
import { appUsers, profiles } from "@/db/schema";
import { auth } from "@/auth"; // Update this to your auth export
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function createAdminAccount(formData: {
  email: string;
  fullName: string;
  password: string;
  role: "admin" | "superadmin";
}) {
  // 1. Authorization Check (The Superadmin Gate)
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("UNAUTHORIZED: Only superadmins can create accounts.");
  }

  const { email, fullName, password, role } = formData;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await db.transaction(async (tx) => {
      // 2. Check if user already exists
      const existing = await tx
        .select()
        .from(appUsers)
        .where(eq(appUsers.email, email.toLowerCase().trim()))
        .limit(1);

      if (existing.length > 0) {
        return { error: "Email already in use" };
      }

      // 3. Create App User
      const [newUser] = await tx
        .insert(appUsers)
        .values({
          email: email.toLowerCase().trim(),
          passwordHash: passwordHash,
        })
        .returning({ id: appUsers.id });

      // 4. Create Profile
      await tx.insert(profiles).values({
        id: newUser.id,
        fullName,
        role,
      });

      revalidatePath("/dashboard/admin-management");
      return { success: true };
    });
  } catch (error) {
    console.error("Failed to create admin:", error);
    return { error: "Database transaction failed" };
  }
}