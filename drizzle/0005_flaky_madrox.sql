CREATE TABLE "occupancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"annual_charge" numeric(12, 2) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "occupancies_resident_year_unique" UNIQUE ("resident_id", "year")
);
--> statement-breakpoint
ALTER TABLE "occupancies" ADD CONSTRAINT "occupancies_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancies" ADD CONSTRAINT "occupancies_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;