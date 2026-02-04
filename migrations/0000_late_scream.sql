CREATE TYPE "public"."influencer_status" AS ENUM('new', 'contacted', 'interested', 'negotiating', 'partnered', 'rejected', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."influencer_tier" AS ENUM('tier1', 'tier2', 'tier3', 'tier4');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
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
CREATE TABLE "influencers" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"channel_title" varchar(200) NOT NULL,
	"thumbnail" text,
	"subscriber_count" integer DEFAULT 0,
	"total_videos" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"email" varchar(255),
	"phone" varchar(20),
	"wechat" varchar(50),
	"description" text,
	"tags" jsonb,
	"category" varchar(50),
	"niche" varchar(100),
	"level" varchar(20) DEFAULT 'C',
	"price_range" varchar(50),
	"average_price" numeric(10, 2) DEFAULT '0',
	"quality_score" numeric(5, 2) DEFAULT '0',
	"cooperation_score" numeric(5, 2) DEFAULT '0',
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'available',
	"is_favorite" boolean DEFAULT false,
	"cooperation_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"last_cooperation_at" timestamp with time zone,
	CONSTRAINT "influencers_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
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
	"publish_date" timestamp with time zone,
	"publish_status" varchar(20) DEFAULT 'draft',
	"cooperation_cost" numeric(10, 2) DEFAULT '0',
	"total_views" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "ai_influencer_videos" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" varchar(36) NOT NULL,
	"video_id" varchar(20) NOT NULL,
	"title" varchar(500),
	"description" text,
	"thumbnail" text,
	"published_at" timestamp with time zone,
	"category_id" varchar(20),
	"category_title" varchar(100),
	"default_language" varchar(10),
	"default_audio_language" varchar(10),
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"favorite_count" integer DEFAULT 0,
	"duration" varchar(20),
	"duration_seconds" integer DEFAULT 0,
	"duration_formatted" varchar(20),
	"tags" jsonb,
	"topic_ids" jsonb,
	"topic_categories" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_influencer_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "ai_influencers" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"channel_title" varchar(200) NOT NULL,
	"channel_thumbnail" text,
	"channel_banner" text,
	"custom_url" varchar(255),
	"subscriber_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"video_count" integer DEFAULT 0,
	"hidden_subscriber_count" boolean DEFAULT false,
	"description" text,
	"keywords" jsonb,
	"created_at" timestamp with time zone,
	"discovered_at" timestamp with time zone,
	"last_updated" timestamp with time zone,
	"default_language" varchar(10),
	"country" varchar(5),
	"branding_settings" jsonb,
	"uploads_playlist_id" varchar(255),
	"avg_views" integer DEFAULT 0,
	"avg_likes" integer DEFAULT 0,
	"avg_comments" integer DEFAULT 0,
	"avg_duration" varchar(20),
	"avg_duration_seconds" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"like_rate" numeric(5, 2) DEFAULT '0',
	"comment_rate" numeric(5, 2) DEFAULT '0',
	"views_trend" numeric(5, 2) DEFAULT '0',
	"likes_trend" numeric(5, 2) DEFAULT '0',
	"comments_trend" numeric(5, 2) DEFAULT '0',
	"publish_frequency" numeric(5, 2) DEFAULT '0',
	"publish_consistency" numeric(3, 2) DEFAULT '0',
	"best_publish_days" jsonb,
	"best_publish_hours" jsonb,
	"avg_publish_interval" numeric(5, 2) DEFAULT '0',
	"content_categories" jsonb,
	"content_keywords" jsonb,
	"avg_title_length" integer DEFAULT 0,
	"avg_description_length" integer DEFAULT 0,
	"avg_thumbnail_quality" varchar(20),
	"has_captions" boolean DEFAULT false,
	"avg_caption_languages" integer DEFAULT 0,
	"inferred_country" jsonb,
	"inferred_language" jsonb,
	"inferred_email" jsonb,
	"inferred_social_media" jsonb,
	"estimated_cost" jsonb,
	"estimated_reach" jsonb,
	"total_score" integer DEFAULT 0,
	"score_tier" varchar(10),
	"score_breakdown" jsonb,
	"score_recommendations" jsonb,
	"status" varchar(20) DEFAULT 'new',
	"priority" varchar(10) DEFAULT 'medium',
	"tags" jsonb,
	"categories" jsonb,
	"contact_info" jsonb,
	"metadata" jsonb,
	"notes" text,
	"assigned_to" varchar(255),
	"assigned_at" timestamp with time zone,
	"budget_info" jsonb,
	"contract_info" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "ai_influencers_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "ai_quota_usage" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"units_used" integer NOT NULL,
	"quota_limit" integer NOT NULL,
	"reset_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_quota_usage_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"influencer_id" varchar(36) NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"note" text,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_influencers" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"influencer_id" varchar(36) NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"list_name" varchar(100) DEFAULT 'default',
	"status" varchar(20) DEFAULT 'added',
	"priority" varchar(10) DEFAULT 'medium',
	"note" text,
	"tags" jsonb,
	"last_contacted_at" timestamp with time zone,
	"cooperation_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "comments_video_id_idx" ON "comments" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "comments_sentiment_idx" ON "comments" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "comments_high_quality_idx" ON "comments" USING btree ("is_high_quality");--> statement-breakpoint
CREATE INDEX "comments_published_at_idx" ON "comments" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "influencers_channel_id_idx" ON "influencers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "influencers_status_idx" ON "influencers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "influencers_level_idx" ON "influencers" USING btree ("level");--> statement-breakpoint
CREATE INDEX "influencers_category_idx" ON "influencers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "influencers_is_favorite_idx" ON "influencers" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "influencers_created_at_idx" ON "influencers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "owners_email_idx" ON "owners" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "video_stats_video_id_date_idx" ON "video_stats" USING btree ("video_id","stat_date");--> statement-breakpoint
CREATE INDEX "videos_video_id_idx" ON "videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_publish_date_idx" ON "videos" USING btree ("publish_date");--> statement-breakpoint
CREATE INDEX "videos_publish_status_idx" ON "videos" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "videos_status_date_idx" ON "videos" USING btree ("publish_status","publish_date");--> statement-breakpoint
CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_influencer_videos_influencer_id_idx" ON "ai_influencer_videos" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "ai_influencer_videos_video_id_idx" ON "ai_influencer_videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "ai_influencer_videos_published_at_idx" ON "ai_influencer_videos" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "ai_influencers_channel_id_idx" ON "ai_influencers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "ai_influencers_status_idx" ON "ai_influencers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_influencers_score_tier_idx" ON "ai_influencers" USING btree ("score_tier");--> statement-breakpoint
CREATE INDEX "ai_influencers_subscriber_count_idx" ON "ai_influencers" USING btree ("subscriber_count");--> statement-breakpoint
CREATE INDEX "ai_influencers_engagement_rate_idx" ON "ai_influencers" USING btree ("engagement_rate");--> statement-breakpoint
CREATE INDEX "ai_influencers_discovered_at_idx" ON "ai_influencers" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "ai_influencers_total_score_idx" ON "ai_influencers" USING btree ("total_score");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_influencer_id_idx" ON "user_favorites" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_influencer_idx" ON "user_favorites" USING btree ("user_id","influencer_id");--> statement-breakpoint
CREATE INDEX "user_favorites_channel_id_idx" ON "user_favorites" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "user_influencers_user_id_idx" ON "user_influencers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_influencers_influencer_id_idx" ON "user_influencers" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "user_influencers_user_list_idx" ON "user_influencers" USING btree ("user_id","list_name");--> statement-breakpoint
CREATE INDEX "user_influencers_user_influencer_idx" ON "user_influencers" USING btree ("user_id","influencer_id");--> statement-breakpoint
CREATE INDEX "user_influencers_channel_id_idx" ON "user_influencers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "user_influencers_status_idx" ON "user_influencers" USING btree ("status");