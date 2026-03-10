-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'BUSINESS', 'AGENCY');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'WRITER');

-- CreateEnum
CREATE TYPE "SearchIntent" AS ENUM ('INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL');

-- CreateEnum
CREATE TYPE "AiEngine" AS ENUM ('CHATGPT', 'GEMINI', 'PERPLEXITY', 'COPILOT', 'CLAUDE');

-- CreateEnum
CREATE TYPE "MentionType" AS ENUM ('DIRECT', 'INDIRECT', 'NOT_MENTIONED');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NONE');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('META_DESCRIPTION_MISSING', 'ALT_MISSING', 'BROKEN_LINK', 'REDIRECT_CHAIN', 'DUPLICATE_CONTENT', 'HTTPS_MIXED', 'H1_MISSING', 'H1_MULTIPLE', 'CANONICAL_MISSING', 'TITLE_TOO_LONG', 'TITLE_TOO_SHORT', 'SLOW_PAGE', 'MOBILE_UNFRIENDLY');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('ERROR', 'WARNING', 'NOTICE');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('DESU_MASU', 'DA_DEARU', 'MIXED');

-- CreateEnum
CREATE TYPE "RegulationStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('NG_WORD', 'EXPRESSION_UNIFY', 'REQUIRED_ELEMENT', 'STYLE_GUIDE');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'WRITING', 'PROOFREADING', 'REVIEWING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('PROOFREAD', 'FACTCHECK', 'COPYCHECK', 'AI_DETECT');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TECHNICAL_SEO', 'MONTHLY', 'KEYWORD', 'GEO');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SLACK', 'CHATWORK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "logo_url" TEXT,
    "brand_color" TEXT,
    "max_projects" INTEGER NOT NULL DEFAULT 1,
    "max_keywords" INTEGER NOT NULL DEFAULT 100,
    "max_geo_checks" INTEGER NOT NULL DEFAULT 50,
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "gsc_property_url" TEXT,
    "ga4_property_id" TEXT,
    "gsc_access_token" TEXT,
    "gsc_refresh_token" TEXT,
    "domain_rating" DECIMAL(5,2),
    "backlink_count" INTEGER,
    "referring_domains" INTEGER,
    "site_health_score" DECIMAL(5,2),
    "geo_score" DECIMAL(5,2),
    "last_crawled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "search_volume" INTEGER,
    "keyword_difficulty" DECIMAL(5,2),
    "search_intent" "SearchIntent",
    "cpc" DECIMAL(8,2),
    "current_position" INTEGER,
    "best_position" INTEGER,
    "geo_score" DECIMAL(5,2),
    "target_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_rankings" (
    "id" BIGSERIAL NOT NULL,
    "keyword_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "position_google" INTEGER,
    "position_yahoo" INTEGER,
    "position_mobile" INTEGER,
    "position_desktop" INTEGER,
    "has_ai_overview" BOOLEAN NOT NULL DEFAULT false,
    "ai_overview_position" INTEGER,
    "serp_features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_geo_checks" (
    "id" TEXT NOT NULL,
    "keyword_id" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engine" "AiEngine" NOT NULL,
    "is_mentioned" BOOLEAN NOT NULL,
    "mention_type" "MentionType",
    "sentiment" "Sentiment",
    "share_of_voice" DECIMAL(5,2),
    "ai_response_text" TEXT,
    "competitors_mentioned" JSONB,

    CONSTRAINT "keyword_geo_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_audits" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pages_crawled" INTEGER NOT NULL,
    "health_score" DECIMAL(5,2) NOT NULL,
    "errors_count" INTEGER NOT NULL,
    "warnings_count" INTEGER NOT NULL,
    "notices_count" INTEGER NOT NULL,
    "cwv_lcp" DECIMAL(8,2),
    "cwv_inp" DECIMAL(8,2),
    "cwv_cls" DECIMAL(8,4),
    "mobile_score" INTEGER,
    "desktop_score" INTEGER,

    CONSTRAINT "site_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_issues" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "page_url" TEXT NOT NULL,
    "issue_type" "IssueType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "audit_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "meta_description" TEXT,
    "h1_count" INTEGER NOT NULL DEFAULT 0,
    "h2_count" INTEGER NOT NULL DEFAULT 0,
    "h3_count" INTEGER NOT NULL DEFAULT 0,
    "h4_count" INTEGER NOT NULL DEFAULT 0,
    "h5_count" INTEGER NOT NULL DEFAULT 0,
    "h6_count" INTEGER NOT NULL DEFAULT 0,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "has_canonical" BOOLEAN NOT NULL DEFAULT false,
    "has_og_tags" BOOLEAN NOT NULL DEFAULT false,
    "has_schema" BOOLEAN NOT NULL DEFAULT false,
    "schema_types" JSONB,
    "has_llms_txt" BOOLEAN NOT NULL DEFAULT false,
    "mobile_friendly" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tone" "Tone" NOT NULL DEFAULT 'DESU_MASU',
    "status" "RegulationStatus" NOT NULL DEFAULT 'DRAFT',
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_rules" (
    "id" TEXT NOT NULL,
    "regulation_id" TEXT NOT NULL,
    "rule_type" "RuleType" NOT NULL,
    "rule_key" TEXT NOT NULL,
    "rule_value" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'WARNING',

    CONSTRAINT "regulation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "regulation_id" TEXT,
    "title" TEXT NOT NULL,
    "target_keyword" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "content_html" TEXT,
    "content_text" TEXT,
    "structure_json" JSONB,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "seo_score" DECIMAL(5,2),
    "geo_score" DECIMAL(5,2),
    "originality_score" DECIMAL(5,2),
    "ai_detection_score" DECIMAL(5,2),
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_checks" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "check_type" "CheckType" NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result_json" JSONB NOT NULL,
    "issues_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_type" "ReportType" NOT NULL,
    "file_url" TEXT,
    "white_label" BOOLEAN NOT NULL DEFAULT false,
    "custom_logo_url" TEXT,
    "custom_company_name" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "webhook_url" TEXT,
    "notify_rank_change" BOOLEAN NOT NULL DEFAULT true,
    "rank_change_threshold" INTEGER NOT NULL DEFAULT 5,
    "notify_errors" BOOLEAN NOT NULL DEFAULT true,
    "notify_geo_change" BOOLEAN NOT NULL DEFAULT true,
    "notify_article_complete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_org_id_user_id_key" ON "org_members"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "keyword_rankings_keyword_id_date_idx" ON "keyword_rankings"("keyword_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_rankings_keyword_id_date_key" ON "keyword_rankings"("keyword_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "regulations_share_token_key" ON "regulations"("share_token");

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_rankings" ADD CONSTRAINT "keyword_rankings_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_geo_checks" ADD CONSTRAINT "keyword_geo_checks_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_audits" ADD CONSTRAINT "site_audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_issues" ADD CONSTRAINT "audit_issues_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "site_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_rules" ADD CONSTRAINT "regulation_rules_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_checks" ADD CONSTRAINT "article_checks_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

