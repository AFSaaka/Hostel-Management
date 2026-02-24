import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { headers } from "next/headers";

export async function createAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
}: {
  actorId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "UPLOAD_RECEIPT";
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
}) {
  const headerList = await headers(); // Mandatory for Next.js 15+
  const ip = headerList.get("x-forwarded-for") || "unknown";
  const ua = headerList.get("user-agent") || "unknown";

  try {
    await db.insert(auditLogs).values({
      actorId,
      action,
      entityType,
      entityId,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (error) {
    // Fail silently to the user, but log for the developer
    console.error("Critical: Audit Log Failed", error);
  }
}