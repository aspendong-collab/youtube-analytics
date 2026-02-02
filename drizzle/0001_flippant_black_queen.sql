CREATE TABLE "owners" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "publish_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "publish_status" varchar(20) DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "cooperation_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "total_views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "user_id" varchar(36);--> statement-breakpoint
CREATE INDEX "owners_email_idx" ON "owners" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "videos_publish_date_idx" ON "videos" USING btree ("publish_date");--> statement-breakpoint
CREATE INDEX "videos_publish_status_idx" ON "videos" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "videos_status_date_idx" ON "videos" USING btree ("publish_status","publish_date");--> statement-breakpoint
CREATE INDEX "videos_user_id_idx" ON "videos" USING btree ("user_id");