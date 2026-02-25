import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { headers } from "next/headers";

const SENSITIVE_FIELDS = ["passwordHash", "password", "token", "secret", "confirmPassword"];

/**
 * Removes sensitive fields and truncates massive objects
 */
function sanitize(data: any) {
  if (!data || typeof data !== "object") return data;
  
  const scrubbed = { ...data };
  SENSITIVE_FIELDS.forEach(field => delete scrubbed[field]);

  // If there are many images, just keep a count to save DB space
  if (Array.isArray(scrubbed.imageUrls) && scrubbed.imageUrls.length > 5) {
    scrubbed.imageUrls = [`${scrubbed.imageUrls.length} files uploaded`];
  }

  return scrubbed;
}

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
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(',')[0] || "unknown"; // Get first IP in chain
  const ua = headerList.get("user-agent") || "unknown";

  try {
    // Sanitize before stringifying
    const cleanOld = sanitize(oldData);
    const cleanNew = sanitize(newData);

    await db.insert(auditLogs).values({
      actorId,
      action,
      entityType,
      entityId,
      oldData: cleanOld ? JSON.stringify(cleanOld) : null,
      newData: cleanNew ? JSON.stringify(cleanNew) : null,
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (error) {
    console.error("Critical: Audit Log Failed", error);
    // In production, you might want to send this to a service like Sentry or Axiom
  }
}