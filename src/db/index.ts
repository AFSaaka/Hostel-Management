import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// This allows the Neon driver to use WebSockets in a Node.js/Next.js environment
if (process.env.NODE_ENV === "development") {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);