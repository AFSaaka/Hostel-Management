//src/db/schema.ts
import { pgEnum, pgTable, uuid, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "momo", "bank"]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => appUsers.id, { onDelete: "cascade" }),

  fullName: text("full_name"),

  role: userRoleEnum("role").notNull().default("admin"),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),

  roomNumber: text("room_number").notNull().unique(),

  capacity: integer("capacity").notNull(), // we'll add the CHECK in SQL migration

  annualPrice: numeric("annual_price", { precision: 12, scale: 2 }).notNull(),

  description: text("description"),

  imageUrls: text("image_urls").array().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const residents = pgTable("residents", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),

  status: text("status").notNull().default("active"), // we'll add CHECK in migration

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const occupancies = pgTable("occupancies", {
  id: uuid("id").defaultRandom().primaryKey(),

  residentId: uuid("resident_id")
    .notNull()
    .references(() => residents.id, { onDelete: "cascade" }),

  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "restrict" }),

  year: integer("year").notNull(),

  annualCharge: numeric("annual_charge", { precision: 12, scale: 2 }).notNull(),

  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),

  residentId: uuid("resident_id")
    .notNull()
    .references(() => residents.id, { onDelete: "cascade" }),

  occupancyId: uuid("occupancy_id").references(() => occupancies.id, {
    onDelete: "set null",
  }),

  year: integer("year").notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),

  method: paymentMethodEnum("method").notNull(),

  note: text("note"),
  receiptUrl: text("receipt_url"),
});

export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "UPLOAD_RECEIPT"
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // The Admin who performed the action
  actorId: uuid("actor_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "restrict" }),
  
  action: auditActionEnum("action").notNull(),
  
  // e.g., "payments", "residents", "rooms"
  entityType: text("entity_type").notNull(),
  
  // The ID of the record being changed
  entityId: uuid("entity_id"),
  
  // JSON snapshots of the data
  oldData: text("old_data"), // Or use custom jsonb type if your driver supports it
  newData: text("new_data"),
  
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostelName: text("hostel_name").notNull().default("My Hostel"),
  logoUrl: text("logo_url"),
  isMaintenanceMode: integer("is_maintenance_mode").notNull().default(0), // 0 = off, 1 = on
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});