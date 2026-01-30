CREATE TABLE "video_stats" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar(20) NOT NULL,
	"stat_date" timestamp with time zone NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar(20) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"thumbnail" text,
	"channel_id" varchar(50),
	"channel_title" varchar(200),
	"tags" jsonb,
	"category_id" varchar(10),
	"owner" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE INDEX "video_stats_video_id_date_idx" ON "video_stats" USING btree ("video_id","stat_date");--> statement-breakpoint
CREATE INDEX "videos_video_id_idx" ON "videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");