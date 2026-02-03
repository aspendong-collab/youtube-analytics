CREATE TABLE "comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar(50) NOT NULL,
	"video_id" varchar(20) NOT NULL,
	"author_name" varchar(255),
	"author_channel_id" varchar(50),
	"text_display" text NOT NULL,
	"like_count" integer DEFAULT 0,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"sentiment" varchar(20),
	"is_high_quality" boolean DEFAULT false,
	"quality_score" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "region" varchar(10);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "language" varchar(10);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "best_publish_time" jsonb;--> statement-breakpoint
CREATE INDEX "comments_video_id_idx" ON "comments" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "comments_sentiment_idx" ON "comments" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "comments_high_quality_idx" ON "comments" USING btree ("is_high_quality");--> statement-breakpoint
CREATE INDEX "comments_published_at_idx" ON "comments" USING btree ("published_at");