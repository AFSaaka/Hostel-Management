CREATE TYPE "public"."payment_method" AS ENUM('cash', 'momo', 'bank');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin');