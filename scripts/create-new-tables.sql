-- 创建用户收藏达人表
CREATE TABLE IF NOT EXISTS "user_favorites" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"influencer_id" varchar(36) NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"note" text,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 创建用户关注/添加达人表
CREATE TABLE IF NOT EXISTS "user_influencers" (
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

-- 创建索引
CREATE INDEX IF NOT EXISTS "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "user_favorites_influencer_id_idx" ON "user_favorites" USING btree ("influencer_id");
CREATE INDEX IF NOT EXISTS "user_favorites_user_influencer_idx" ON "user_favorites" USING btree ("user_id","influencer_id");
CREATE INDEX IF NOT EXISTS "user_favorites_channel_id_idx" ON "user_favorites" USING btree ("channel_id");

CREATE INDEX IF NOT EXISTS "user_influencers_user_id_idx" ON "user_influencers" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "user_influencers_influencer_id_idx" ON "user_influencers" USING btree ("influencer_id");
CREATE INDEX IF NOT EXISTS "user_influencers_user_list_idx" ON "user_influencers" USING btree ("user_id","list_name");
CREATE INDEX IF NOT EXISTS "user_influencers_user_influencer_idx" ON "user_influencers" USING btree ("user_id","influencer_id");
CREATE INDEX IF NOT EXISTS "user_influencers_channel_id_idx" ON "user_influencers" USING btree ("channel_id");
CREATE INDEX IF NOT EXISTS "user_influencers_status_idx" ON "user_influencers" USING btree ("status");
