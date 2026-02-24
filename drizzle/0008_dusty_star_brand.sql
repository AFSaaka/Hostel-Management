CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostel_name" text DEFAULT 'My Hostel' NOT NULL,
	"logo_url" text,
	"is_maintenance_mode" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
