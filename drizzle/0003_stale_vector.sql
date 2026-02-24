CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_number" text NOT NULL,
	"capacity" integer NOT NULL,
	"annual_price" numeric(12, 2) NOT NULL,
	"description" text,
	"image_urls" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number"),
	CONSTRAINT "rooms_capacity_check" CHECK ("capacity" > 0)
);
