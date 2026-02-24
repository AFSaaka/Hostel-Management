CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"role" "user_role" DEFAULT 'admin' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_app_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;