-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MembershipPlan" AS ENUM ('CORE', 'ASSOCIATE', 'STUDENT');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MentorStatus" AS ENUM ('PENDING', 'APPROVED', 'PAUSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MentorMode" AS ENUM ('ONLINE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "MentorshipStage" AS ENUM ('CA_STUDENT', 'NEWLY_QUALIFIED', 'PRACTISING', 'INDUSTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "MentorshipRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'DECLINED');

-- CreateEnum
CREATE TYPE "TeamGroup" AS ENUM ('LEADERSHIP', 'CORE_TEAM', 'ADVISORY_BOARD', 'WING_CONVENERS');

-- CreateEnum
CREATE TYPE "TaxonomyKind" AS ENUM ('EVENT_CATEGORY', 'NEWS_CATEGORY', 'RESOURCE_CATEGORY', 'GALLERY_CATEGORY', 'JOB_TYPE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthTokenPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "OutboxChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "site_name" VARCHAR(80) NOT NULL,
    "tagline" VARCHAR(200) NOT NULL,
    "hero_eyebrow" VARCHAR(160) NOT NULL,
    "hero_headline" VARCHAR(160) NOT NULL,
    "hero_headline_accent" VARCHAR(120) NOT NULL,
    "hero_intro" VARCHAR(600) NOT NULL,
    "hero_image_url" VARCHAR(500),
    "announcement" VARCHAR(300),
    "fee_core" DECIMAL(10,2),
    "fee_associate" DECIMAL(10,2),
    "fee_student" DECIMAL(10,2),
    "contact_email" CITEXT,
    "contact_phone" VARCHAR(40),
    "contact_address" VARCHAR(400),
    "contact_map_url" VARCHAR(2000),
    "social_linkedin" VARCHAR(500),
    "social_instagram" VARCHAR(500),
    "social_facebook" VARCHAR(500),
    "social_youtube" VARCHAR(500),
    "social_x" VARCHAR(500),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" TEXT,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_terms" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "kind" "TaxonomyKind" NOT NULL,
    "value" CITEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "number" INTEGER NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "color" CHAR(7) NOT NULL,
    "tags" VARCHAR(300) NOT NULL DEFAULT '',
    "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "wing_id" TEXT NOT NULL,
    "category" CITEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(40) NOT NULL,
    "end_time" VARCHAR(40),
    "mode" "EventMode" NOT NULL,
    "venue" VARCHAR(200) NOT NULL,
    "city" VARCHAR(120) NOT NULL DEFAULT '',
    "map_url" VARCHAR(2000),
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "member_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "seats_total" INTEGER NOT NULL,
    "seats_taken" INTEGER NOT NULL DEFAULT 0,
    "cpe_hours" DECIMAL(5,2),
    "description" TEXT NOT NULL,
    "terms" TEXT,
    "image_url" VARCHAR(500),
    "registration_open" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancellation_note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_agenda_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "event_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "time" VARCHAR(40) NOT NULL DEFAULT '',
    "title" VARCHAR(200) NOT NULL,
    "speaker" VARCHAR(120),

    CONSTRAINT "event_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "qualification" VARCHAR(120),
    "organisation" VARCHAR(160),
    "headline" VARCHAR(140),
    "bio" VARCHAR(2000) NOT NULL,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "talks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stats" JSONB NOT NULL DEFAULT '[]',
    "quote" VARCHAR(300),
    "avatar_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_speakers" (
    "event_id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("event_id","speaker_id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" CITEXT NOT NULL,
    "date_label" VARCHAR(40) NOT NULL,
    "published_on" DATE NOT NULL,
    "author" VARCHAR(120),
    "summary" VARCHAR(600) NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(200) NOT NULL,
    "category" CITEXT NOT NULL,
    "format" VARCHAR(80) NOT NULL,
    "wing_id" TEXT,
    "file_url" VARCHAR(2000),
    "is_members_only" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(200) NOT NULL,
    "category" CITEXT NOT NULL,
    "date_label" VARCHAR(40) NOT NULL,
    "location" VARCHAR(160) NOT NULL,
    "accent_gradient" VARCHAR(200) NOT NULL DEFAULT '',
    "image_url" VARCHAR(500),
    "video_url" VARCHAR(2000),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(120) NOT NULL,
    "designation" VARCHAR(160) NOT NULL,
    "team_group" "TeamGroup" NOT NULL,
    "wing_id" TEXT,
    "background" VARCHAR(2000),
    "photo_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 10,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(120) NOT NULL,
    "designation" VARCHAR(160),
    "quote" VARCHAR(1200) NOT NULL,
    "photo_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiatives" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1200) NOT NULL,
    "tag" VARCHAR(60),
    "date" DATE,
    "cta_label" VARCHAR(60),
    "cta_url" VARCHAR(2000),
    "image_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "initiatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "organisation" VARCHAR(160) NOT NULL,
    "type" CITEXT NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "work_mode" "WorkMode" NOT NULL,
    "experience" VARCHAR(120),
    "compensation" VARCHAR(120),
    "description" TEXT NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apply_url" VARCHAR(2000),
    "apply_email" CITEXT,
    "deadline" DATE,
    "wing_id" TEXT,
    "logo_url" VARCHAR(500),
    "is_members_only" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "mobile" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(3),
    "session_version" INTEGER NOT NULL DEFAULT 1,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_profiles" (
    "account_id" TEXT NOT NULL,
    "city" VARCHAR(120),
    "membership_no" VARCHAR(40),
    "qualification_year" VARCHAR(10),
    "area_of_practice" VARCHAR(160),
    "organisation" VARCHAR(160),
    "designation" VARCHAR(160),
    "linkedin_url" VARCHAR(500),
    "bio" VARCHAR(2000),
    "photo_url" VARCHAR(500),
    "directory_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "account_id" TEXT NOT NULL,
    "purpose" "AuthTokenPurpose" NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "username" CITEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "password_hash" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "password_changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totp_secret_enc" VARCHAR(255),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" VARCHAR(200) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "booking_id" VARCHAR(40) NOT NULL,
    "access_token_hash" CHAR(64) NOT NULL,
    "checkin_code_hash" CHAR(64),
    "event_id" TEXT NOT NULL,
    "account_id" TEXT,
    "event_title" VARCHAR(200) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "membership_no" VARCHAR(40),
    "organisation" VARCHAR(120),
    "designation" VARCHAR(120),
    "requirements" VARCHAR(1000),
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "RegistrationStatus" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "gateway_order_id" VARCHAR(64),
    "gateway_payment_id" VARCHAR(64),
    "paid_at" TIMESTAMPTZ(3),
    "refund_id" VARCHAR(64),
    "refund_amount" DECIMAL(10,2),
    "refunded_at" TIMESTAMPTZ(3),
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "attended_at" TIMESTAMPTZ(3),
    "certificate_id" VARCHAR(40),
    "reminder_sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "account_id" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "plan" "MembershipPlan" NOT NULL,
    "membership_no" VARCHAR(40),
    "qualification_year" VARCHAR(10),
    "area_of_practice" VARCHAR(160),
    "organisation" VARCHAR(160),
    "linkedin_url" VARCHAR(500),
    "photo_url" VARCHAR(500),
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "fee" DECIMAL(10,2),
    "gateway_order_id" VARCHAR(64),
    "valid_until" TIMESTAMPTZ(3),
    "renewal_reminder_for" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_interests" (
    "membership_id" TEXT NOT NULL,
    "wing_id" TEXT NOT NULL,

    CONSTRAINT "membership_interests_pkey" PRIMARY KEY ("membership_id","wing_id")
);

-- CreateTable
CREATE TABLE "membership_payments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "receipt_id" VARCHAR(40) NOT NULL,
    "membership_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "gateway_order_id" VARCHAR(64),
    "gateway_payment_id" VARCHAR(64),
    "paid_at" TIMESTAMPTZ(3) NOT NULL,
    "valid_from" TIMESTAMPTZ(3) NOT NULL,
    "valid_until" TIMESTAMPTZ(3) NOT NULL,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentors" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "account_id" TEXT NOT NULL,
    "headline" VARCHAR(160) NOT NULL,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modes" "MentorMode"[] DEFAULT ARRAY[]::"MentorMode"[],
    "city" VARCHAR(120),
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "bio" VARCHAR(1500) NOT NULL,
    "linkedin_url" VARCHAR(500),
    "status" "MentorStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_wings" (
    "mentor_id" TEXT NOT NULL,
    "wing_id" TEXT NOT NULL,

    CONSTRAINT "mentor_wings_pkey" PRIMARY KEY ("mentor_id","wing_id")
);

-- CreateTable
CREATE TABLE "mentorship_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "account_id" TEXT NOT NULL,
    "stage" "MentorshipStage" NOT NULL,
    "goals" VARCHAR(1500) NOT NULL,
    "preferred_mentor_id" TEXT,
    "mentor_id" TEXT,
    "status" "MentorshipRequestStatus" NOT NULL DEFAULT 'OPEN',
    "matched_at" TIMESTAMPTZ(3),
    "admin_note" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_request_wings" (
    "request_id" TEXT NOT NULL,
    "wing_id" TEXT NOT NULL,

    CONSTRAINT "mentorship_request_wings_pkey" PRIMARY KEY ("request_id","wing_id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(20),
    "subject" VARCHAR(160) NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "channel" "OutboxChannel" NOT NULL,
    "recipient" VARCHAR(320) NOT NULL,
    "template" VARCHAR(80) NOT NULL,
    "subject" VARCHAR(300),
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(1000),
    "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" TEXT,
    "action" VARCHAR(80) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entity_id" VARCHAR(80),
    "changes" JSONB,
    "ip" INET,
    "user_agent" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "taxonomy_terms_kind_sort_order_idx" ON "taxonomy_terms"("kind", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_terms_kind_value_key" ON "taxonomy_terms"("kind", "value");

-- CreateIndex
CREATE UNIQUE INDEX "wings_number_key" ON "wings"("number");

-- CreateIndex
CREATE UNIQUE INDEX "wings_name_key" ON "wings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wings_slug_key" ON "wings"("slug");

-- CreateIndex
CREATE INDEX "wings_is_published_number_idx" ON "wings"("is_published", "number");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_is_published_date_idx" ON "events"("is_published", "date");

-- CreateIndex
CREATE INDEX "events_wing_id_date_idx" ON "events"("wing_id", "date");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_featured_date_idx" ON "events"("featured", "date");

-- CreateIndex
CREATE UNIQUE INDEX "event_agenda_items_event_id_position_key" ON "event_agenda_items"("event_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "speakers_slug_key" ON "speakers"("slug");

-- CreateIndex
CREATE INDEX "speakers_is_published_name_idx" ON "speakers"("is_published", "name");

-- CreateIndex
CREATE INDEX "event_speakers_speaker_id_idx" ON "event_speakers"("speaker_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX "news_articles_is_published_published_on_idx" ON "news_articles"("is_published", "published_on" DESC);

-- CreateIndex
CREATE INDEX "news_articles_category_idx" ON "news_articles"("category");

-- CreateIndex
CREATE INDEX "resources_is_published_category_idx" ON "resources"("is_published", "category");

-- CreateIndex
CREATE INDEX "resources_wing_id_idx" ON "resources"("wing_id");

-- CreateIndex
CREATE INDEX "gallery_items_is_published_category_idx" ON "gallery_items"("is_published", "category");

-- CreateIndex
CREATE INDEX "team_members_is_published_team_group_sort_order_idx" ON "team_members"("is_published", "team_group", "sort_order");

-- CreateIndex
CREATE INDEX "team_members_wing_id_idx" ON "team_members"("wing_id");

-- CreateIndex
CREATE INDEX "testimonials_is_published_created_at_idx" ON "testimonials"("is_published", "created_at");

-- CreateIndex
CREATE INDEX "initiatives_is_published_date_idx" ON "initiatives"("is_published", "date");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_is_published_deadline_idx" ON "jobs"("is_published", "deadline");

-- CreateIndex
CREATE INDEX "jobs_type_idx" ON "jobs"("type");

-- CreateIndex
CREATE INDEX "jobs_wing_id_idx" ON "jobs"("wing_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_accounts_email_key" ON "member_accounts"("email");

-- CreateIndex
CREATE INDEX "member_profiles_directory_opt_in_city_idx" ON "member_profiles"("directory_opt_in", "city");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_account_id_purpose_idx" ON "auth_tokens"("account_id", "purpose");

-- CreateIndex
CREATE INDEX "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_booking_id_key" ON "event_registrations"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_access_token_hash_key" ON "event_registrations"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_checkin_code_hash_key" ON "event_registrations"("checkin_code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_gateway_order_id_key" ON "event_registrations"("gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_gateway_payment_id_key" ON "event_registrations"("gateway_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_refund_id_key" ON "event_registrations"("refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_certificate_id_key" ON "event_registrations"("certificate_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_status_updated_at_idx" ON "event_registrations"("event_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "event_registrations_email_idx" ON "event_registrations"("email");

-- CreateIndex
CREATE INDEX "event_registrations_account_id_idx" ON "event_registrations"("account_id");

-- CreateIndex
CREATE INDEX "event_registrations_payment_status_created_at_idx" ON "event_registrations"("payment_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_account_id_key" ON "memberships"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_email_key" ON "memberships"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_gateway_order_id_key" ON "memberships"("gateway_order_id");

-- CreateIndex
CREATE INDEX "memberships_status_created_at_idx" ON "memberships"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "memberships_plan_idx" ON "memberships"("plan");

-- CreateIndex
CREATE INDEX "memberships_city_idx" ON "memberships"("city");

-- CreateIndex
CREATE INDEX "memberships_status_valid_until_idx" ON "memberships"("status", "valid_until");

-- CreateIndex
CREATE INDEX "membership_interests_wing_id_idx" ON "membership_interests"("wing_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_receipt_id_key" ON "membership_payments"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_gateway_payment_id_key" ON "membership_payments"("gateway_payment_id");

-- CreateIndex
CREATE INDEX "membership_payments_membership_id_paid_at_idx" ON "membership_payments"("membership_id", "paid_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "mentors_account_id_key" ON "mentors"("account_id");

-- CreateIndex
CREATE INDEX "mentors_status_idx" ON "mentors"("status");

-- CreateIndex
CREATE INDEX "mentor_wings_wing_id_idx" ON "mentor_wings"("wing_id");

-- CreateIndex
CREATE INDEX "mentorship_requests_status_created_at_idx" ON "mentorship_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "mentorship_requests_mentor_id_status_idx" ON "mentorship_requests"("mentor_id", "status");

-- CreateIndex
CREATE INDEX "mentorship_requests_account_id_status_idx" ON "mentorship_requests"("account_id", "status");

-- CreateIndex
CREATE INDEX "mentorship_requests_preferred_mentor_id_idx" ON "mentorship_requests"("preferred_mentor_id");

-- CreateIndex
CREATE INDEX "mentorship_request_wings_wing_id_idx" ON "mentorship_request_wings"("wing_id");

-- CreateIndex
CREATE INDEX "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notification_outbox_status_next_attempt_at_idx" ON "notification_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "notification_outbox_created_at_idx" ON "notification_outbox"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_created_at_idx" ON "audit_logs"("entity", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_created_at_idx" ON "audit_logs"("admin_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_agenda_items" ADD CONSTRAINT "event_agenda_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_interests" ADD CONSTRAINT "membership_interests_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_interests" ADD CONSTRAINT "membership_interests_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_wings" ADD CONSTRAINT "mentor_wings_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_wings" ADD CONSTRAINT "mentor_wings_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "member_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_preferred_mentor_id_fkey" FOREIGN KEY ("preferred_mentor_id") REFERENCES "mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_request_wings" ADD CONSTRAINT "mentorship_request_wings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "mentorship_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_request_wings" ADD CONSTRAINT "mentorship_request_wings_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

