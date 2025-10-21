ALTER TABLE "invitations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_id" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id");