
//src/lib/auth-utils.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * PRODUCTION-READY GUARD: 
 * Use this in Server Components or Server Actions to enforce Superadmin only.
 */
export async function ensureSuperadmin() {
  const session = await auth();
  
  if (!session || session.user.role !== "superadmin") {
    // In production, we redirect to dashboard or 403
    redirect("/dashboard?error=Unauthorized");
  }
  
  return session;
}