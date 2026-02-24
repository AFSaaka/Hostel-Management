import { config } from "dotenv";
import path from "path";

// Load environment
config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("--- Seeding Initial Superadmin ---");

  // Dynamic imports to ensure env is loaded first
  const { db } = await import("./index");
  const { appUsers, profiles } = await import("./schema");
  const bcrypt = await import("bcryptjs");

  const EMAIL = "admin@hostel.com"; 
  const PASSWORD = "Password123!"; 
  const FULL_NAME = "Hostel Superadmin";

  const passwordHash = await bcrypt.default.hash(PASSWORD, 12);

  try {
    // 1. Create the App User
    const [newUser] = await db
      .insert(appUsers)
      .values({
        email: EMAIL.toLowerCase(),
        passwordHash: passwordHash,
      })
      .returning({ id: appUsers.id });

    console.log(`- User created with ID: ${newUser.id}`);

    // 2. Create the Profile
    await db.insert(profiles).values({
      id: newUser.id,
      fullName: FULL_NAME,
      role: "superadmin",
    });

    console.log("✅ Seed Successful!");
    console.log(`Email: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();