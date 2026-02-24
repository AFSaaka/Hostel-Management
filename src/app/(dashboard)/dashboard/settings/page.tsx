import { auth } from "@/auth";
import { db } from "@/db";
import { profiles, systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsTabs from "@/components/SettingsTabs";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 1. Fetch User Profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  if (!profile) redirect("/login");

  // 2. Fetch Global System Settings
  // We use standard select since index.ts isn't using the relational API
  const [settings] = await db.select().from(systemSettings).limit(1);

  // 3. Define a default state if the DB row doesn't exist yet
  const defaultSettings = {
    hostelName: "My Hostel",
    logoUrl: "",
    isMaintenanceMode: 0,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-slate-500 font-medium">
          Manage your account and system preferences.
        </p>
      </div>

      <SettingsTabs
        profile={profile}
        isSuperadmin={profile.role === "superadmin"}
        systemSettings={settings || defaultSettings}
      />
    </div>
  );
}
