import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(rooms).limit(5);
  return NextResponse.json({ ok: true, rooms: data });
}