import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { cache } from "react";

export const getCachedSettings = cache(async () => {
  try {
    const settings = await db.select().from(systemSettings).limit(1);
    return settings[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
});