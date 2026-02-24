"use server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit";

export async function recordPayment(formData: FormData) {
  const session = await auth();
  // Production check: Ensure we have an actor ID for the audit log
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const residentId = formData.get("residentId") as string;
  const occupancyId = formData.get("occupancyId") as string;
  const amount = formData.get("amount") as string;
  const method = formData.get("method") as "cash" | "momo" | "bank";
  const note = formData.get("note") as string;
  const receiptUrl = formData.get("receiptUrl") as string;
  const year = parseInt(formData.get("year") as string) || new Date().getFullYear();

  if (!residentId || !amount || parseFloat(amount) <= 0) {
    return { success: false, error: "Valid resident and amount are required." };
  }

  try {
    const [newPayment] = await db.insert(payments).values({
      residentId,
      occupancyId: occupancyId || null,
      amount,
      method,
      note,
      year,
      receiptUrl: receiptUrl || null,
    }).returning(); // Return the inserted row to get the ID for the log

    // 1. Log the creation
    await createAuditLog({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "payments",
      entityId: newPayment.id,
      newData: newPayment,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/residents");
    
    return { success: true };
  } catch (error: any) {
    console.error("Payment Error:", error);
    return { success: false, error: "Database error: Could not record payment." };
  }
}

export async function updatePaymentReceipt(paymentId: string, receiptUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch current state before update to log the change
    const [oldPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!oldPayment) return { success: false, error: "Record not found" };

    // 2. Perform Update
    await db
      .update(payments)
      .set({ receiptUrl })
      .where(eq(payments.id, paymentId));

    // 3. Log the update with diff
    await createAuditLog({
      actorId: session.user.id,
      action: "UPLOAD_RECEIPT",
      entityType: "payments",
      entityId: paymentId,
      oldData: { receiptUrl: oldPayment.receiptUrl },
      newData: { receiptUrl: receiptUrl },
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/residents");
    return { success: true };
  } catch (error) {
    console.error("Failed to update receipt:", error);
    return { success: false, error: "Failed to update record" };
  }
}