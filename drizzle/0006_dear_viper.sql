CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"occupancy_id" uuid,
	"year" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" "payment_method" NOT NULL,
	"note" text,
	"receipt_url" text,
	CONSTRAINT "payments_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_occupancy_id_occupancies_id_fk" FOREIGN KEY ("occupancy_id") REFERENCES "public"."occupancies"("id") ON DELETE set null ON UPDATE no action;