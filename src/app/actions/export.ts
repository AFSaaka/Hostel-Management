"use server";

import { db } from "@/db";
import { residents, payments, rooms } from "@/db/schema";
import { auth } from "@/auth";

export async function exportTableToCSV(tableName: "residents" | "payments" | "rooms") {
  const session = await auth();
  if (session?.user?.role !== "superadmin") throw new Error("Unauthorized");

  let data: any[] = [];

  // Fetch data based on table name
  if (tableName === "residents") data = await db.select().from(residents);
  if (tableName === "payments") data = await db.select().from(payments);
  if (tableName === "rooms") data = await db.select().from(rooms);

  if (data.length === 0) return { success: false, error: "No data to export" };

  // Generate CSV String
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => 
    Object.values(row).map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
  );
  
  const csvContent = [headers, ...rows].join("\n");
  
  return { success: true, data: csvContent, filename: `${tableName}_export_${Date.now()}.csv` };
}