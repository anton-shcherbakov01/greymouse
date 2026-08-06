import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cases_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum_cases_blocks_image_pair_ratio" AS ENUM('equal', 'left', 'right');
  CREATE TYPE "public"."enum_cases_blocks_gallery_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum_cases_blocks_text_media_media_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum__cases_v_blocks_image_pair_ratio" AS ENUM('equal', 'left', 'right');
  CREATE TYPE "public"."enum__cases_v_blocks_gallery_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum__cases_v_blocks_text_media_media_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_services_stage" AS ENUM('research', 'design', 'development', 'growth', 'ai');
  CREATE TYPE "public"."enum_services_icon" AS ENUM('signal', 'grid', 'layers', 'path', 'core');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'in-progress', 'closed', 'spam');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TABLE "cases_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "cases_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"width" "enum_cases_blocks_rich_text_width" DEFAULT 'narrow',
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_full_width_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"bleed" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"ratio" "enum_cases_blocks_image_pair_ratio" DEFAULT 'equal',
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "cases_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum_cases_blocks_gallery_columns" DEFAULT '2',
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"poster_id" integer,
  	"caption" varchar,
  	"autoplay" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"author" varchar,
  	"author_role" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_metric_grid_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"source" varchar
  );
  
  CREATE TABLE "cases_blocks_metric_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"media_id" integer,
  	"media_position" "enum_cases_blocks_text_media_media_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_sticky_text_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "cases_blocks_sticky_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_blocks_next_case" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"case_id" integer,
  	"label" varchar DEFAULT 'Следующий проект',
  	"block_name" varchar
  );
  
  CREATE TABLE "cases_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"source" varchar
  );
  
  CREATE TABLE "cases_project_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"person_id" integer,
  	"external_name" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"client" varchar,
  	"short_description" varchar,
  	"short_result" varchar,
  	"cover_id" integer,
  	"hero_media_id" integer,
  	"challenge" jsonb,
  	"context" jsonb,
  	"solution" jsonb,
  	"process" jsonb,
  	"results" jsonb,
  	"testimonial_quote" varchar,
  	"testimonial_author" varchar,
  	"testimonial_role" varchar,
  	"testimonial_photo_id" integer,
  	"related_case_id" integer,
  	"external_url" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"year" numeric DEFAULT 2026,
  	"featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 100,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cases_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cases_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "_cases_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"width" "enum__cases_v_blocks_rich_text_width" DEFAULT 'narrow',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_full_width_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"bleed" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"ratio" "enum__cases_v_blocks_image_pair_ratio" DEFAULT 'equal',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum__cases_v_blocks_gallery_columns" DEFAULT '2',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"poster_id" integer,
  	"caption" varchar,
  	"autoplay" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"author" varchar,
  	"author_role" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_metric_grid_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"source" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_metric_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"media_id" integer,
  	"media_position" "enum__cases_v_blocks_text_media_media_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_sticky_text_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_sticky_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_blocks_next_case" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"case_id" integer,
  	"label" varchar DEFAULT 'Следующий проект',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cases_v_version_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"source" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_version_project_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"person_id" integer,
  	"external_name" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_client" varchar,
  	"version_short_description" varchar,
  	"version_short_result" varchar,
  	"version_cover_id" integer,
  	"version_hero_media_id" integer,
  	"version_challenge" jsonb,
  	"version_context" jsonb,
  	"version_solution" jsonb,
  	"version_process" jsonb,
  	"version_results" jsonb,
  	"version_testimonial_quote" varchar,
  	"version_testimonial_author" varchar,
  	"version_testimonial_role" varchar,
  	"version_testimonial_photo_id" integer,
  	"version_related_case_id" integer,
  	"version_external_url" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_year" numeric DEFAULT 2026,
  	"version_featured" boolean DEFAULT false,
  	"version_sort_order" numeric DEFAULT 100,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_cases_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "services_client_problems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services_scope" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"promise" varchar NOT NULL,
  	"short_description" varchar,
  	"full_description" jsonb,
  	"cta_label" varchar DEFAULT 'Обсудить проект',
  	"cta_href" varchar DEFAULT '/contact',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"stage" "enum_services_stage" DEFAULT 'design' NOT NULL,
  	"icon" "enum_services_icon" DEFAULT 'signal',
  	"visual_id" integer,
  	"sort_order" numeric DEFAULT 100,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cases_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"sort_order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "team" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"photo_id" integer,
  	"short_bio" varchar,
  	"extended_bio" jsonb,
  	"quote" varchar,
  	"sort_order" numeric DEFAULT 100,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"decorative" boolean DEFAULT false,
  	"caption" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_portrait_url" varchar,
  	"sizes_portrait_width" numeric,
  	"sizes_portrait_height" numeric,
  	"sizes_portrait_mime_type" varchar,
  	"sizes_portrait_filesize" numeric,
  	"sizes_portrait_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"contact" varchar NOT NULL,
  	"company" varchar,
  	"budget" varchar,
  	"message" varchar NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'new',
  	"consent" boolean DEFAULT false,
  	"meta_source_page" varchar,
  	"meta_user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cases_id" integer,
  	"services_id" integer,
  	"categories_id" integer,
  	"team_id" integer,
  	"media_id" integer,
  	"enquiries_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_principles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"duration" varchar
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Серая Мышь' NOT NULL,
  	"hero_heading" varchar DEFAULT 'Серая Мышь' NOT NULL,
  	"hero_subheading" varchar DEFAULT 'Тихо делаем заметные цифровые продукты.' NOT NULL,
  	"hero_note" varchar,
  	"primary_cta_label" varchar DEFAULT 'Смотреть кейсы',
  	"primary_cta_href" varchar DEFAULT '/cases',
  	"secondary_cta_label" varchar DEFAULT 'Обсудить проект',
  	"secondary_cta_href" varchar DEFAULT '/contact',
  	"positioning" varchar DEFAULT 'Небольшая студия, которая делает продукты внимательно и без лишнего шума: разбираемся в задаче, проектируем, пишем код и остаёмся рядом после запуска.',
  	"contact_heading" varchar DEFAULT 'Расскажите про задачу',
  	"contact_text" varchar DEFAULT 'Напишите пару предложений о продукте и о том, что нужно сделать. Ответим в течение рабочего дня.',
  	"email" varchar,
  	"telegram" varchar,
  	"phone" varchar,
  	"city" varchar,
  	"footer_text" varchar,
  	"legal_name" varchar,
  	"consent_text" varchar DEFAULT 'Отправляя форму, вы соглашаетесь на обработку персональных данных для ответа на обращение.',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"organization_description" varchar,
  	"analytics_yandex_metrika_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_groups_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_cta_label" varchar DEFAULT 'Обсудить проект',
  	"header_cta_href" varchar DEFAULT '/contact',
  	"header_cta_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cases_tags" ADD CONSTRAINT "cases_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_rich_text" ADD CONSTRAINT "cases_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_full_width_image" ADD CONSTRAINT "cases_blocks_full_width_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_full_width_image" ADD CONSTRAINT "cases_blocks_full_width_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_image_pair" ADD CONSTRAINT "cases_blocks_image_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_image_pair" ADD CONSTRAINT "cases_blocks_image_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_image_pair" ADD CONSTRAINT "cases_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_gallery_items" ADD CONSTRAINT "cases_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_gallery_items" ADD CONSTRAINT "cases_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_gallery" ADD CONSTRAINT "cases_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_video" ADD CONSTRAINT "cases_blocks_video_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_video" ADD CONSTRAINT "cases_blocks_video_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_video" ADD CONSTRAINT "cases_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_quote" ADD CONSTRAINT "cases_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_metric_grid_metrics" ADD CONSTRAINT "cases_blocks_metric_grid_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases_blocks_metric_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_metric_grid" ADD CONSTRAINT "cases_blocks_metric_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_text_media" ADD CONSTRAINT "cases_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_text_media" ADD CONSTRAINT "cases_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_sticky_text_steps" ADD CONSTRAINT "cases_blocks_sticky_text_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_sticky_text_steps" ADD CONSTRAINT "cases_blocks_sticky_text_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases_blocks_sticky_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_sticky_text" ADD CONSTRAINT "cases_blocks_sticky_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_blocks_next_case" ADD CONSTRAINT "cases_blocks_next_case_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_blocks_next_case" ADD CONSTRAINT "cases_blocks_next_case_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_metrics" ADD CONSTRAINT "cases_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_project_team" ADD CONSTRAINT "cases_project_team_person_id_team_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_project_team" ADD CONSTRAINT "cases_project_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_testimonial_photo_id_media_id_fk" FOREIGN KEY ("testimonial_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_related_case_id_cases_id_fk" FOREIGN KEY ("related_case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_tags" ADD CONSTRAINT "_cases_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_rich_text" ADD CONSTRAINT "_cases_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_full_width_image" ADD CONSTRAINT "_cases_v_blocks_full_width_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_full_width_image" ADD CONSTRAINT "_cases_v_blocks_full_width_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_image_pair" ADD CONSTRAINT "_cases_v_blocks_image_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_image_pair" ADD CONSTRAINT "_cases_v_blocks_image_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_image_pair" ADD CONSTRAINT "_cases_v_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_gallery_items" ADD CONSTRAINT "_cases_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_gallery_items" ADD CONSTRAINT "_cases_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_gallery" ADD CONSTRAINT "_cases_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_video" ADD CONSTRAINT "_cases_v_blocks_video_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_video" ADD CONSTRAINT "_cases_v_blocks_video_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_video" ADD CONSTRAINT "_cases_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_quote" ADD CONSTRAINT "_cases_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_metric_grid_metrics" ADD CONSTRAINT "_cases_v_blocks_metric_grid_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v_blocks_metric_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_metric_grid" ADD CONSTRAINT "_cases_v_blocks_metric_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_text_media" ADD CONSTRAINT "_cases_v_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_text_media" ADD CONSTRAINT "_cases_v_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_sticky_text_steps" ADD CONSTRAINT "_cases_v_blocks_sticky_text_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_sticky_text_steps" ADD CONSTRAINT "_cases_v_blocks_sticky_text_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v_blocks_sticky_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_sticky_text" ADD CONSTRAINT "_cases_v_blocks_sticky_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_next_case" ADD CONSTRAINT "_cases_v_blocks_next_case_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_blocks_next_case" ADD CONSTRAINT "_cases_v_blocks_next_case_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_metrics" ADD CONSTRAINT "_cases_v_version_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_project_team" ADD CONSTRAINT "_cases_v_version_project_team_person_id_team_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_version_project_team" ADD CONSTRAINT "_cases_v_version_project_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_parent_id_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_testimonial_photo_id_media_id_fk" FOREIGN KEY ("version_testimonial_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_related_case_id_cases_id_fk" FOREIGN KEY ("version_related_case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_client_problems" ADD CONSTRAINT "services_client_problems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_scope" ADD CONSTRAINT "services_scope_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_deliverables" ADD CONSTRAINT "services_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_visual_id_media_id_fk" FOREIGN KEY ("visual_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_links" ADD CONSTRAINT "team_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team" ADD CONSTRAINT "team_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_principles" ADD CONSTRAINT "site_settings_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_process_steps" ADD CONSTRAINT "site_settings_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_legal_links" ADD CONSTRAINT "site_settings_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups_links" ADD CONSTRAINT "navigation_footer_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups" ADD CONSTRAINT "navigation_footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cases_tags_order_idx" ON "cases_tags" USING btree ("_order");
  CREATE INDEX "cases_tags_parent_id_idx" ON "cases_tags" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_rich_text_order_idx" ON "cases_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "cases_blocks_rich_text_parent_id_idx" ON "cases_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_rich_text_path_idx" ON "cases_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "cases_blocks_full_width_image_order_idx" ON "cases_blocks_full_width_image" USING btree ("_order");
  CREATE INDEX "cases_blocks_full_width_image_parent_id_idx" ON "cases_blocks_full_width_image" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_full_width_image_path_idx" ON "cases_blocks_full_width_image" USING btree ("_path");
  CREATE INDEX "cases_blocks_full_width_image_image_idx" ON "cases_blocks_full_width_image" USING btree ("image_id");
  CREATE INDEX "cases_blocks_image_pair_order_idx" ON "cases_blocks_image_pair" USING btree ("_order");
  CREATE INDEX "cases_blocks_image_pair_parent_id_idx" ON "cases_blocks_image_pair" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_image_pair_path_idx" ON "cases_blocks_image_pair" USING btree ("_path");
  CREATE INDEX "cases_blocks_image_pair_left_idx" ON "cases_blocks_image_pair" USING btree ("left_id");
  CREATE INDEX "cases_blocks_image_pair_right_idx" ON "cases_blocks_image_pair" USING btree ("right_id");
  CREATE INDEX "cases_blocks_gallery_items_order_idx" ON "cases_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "cases_blocks_gallery_items_parent_id_idx" ON "cases_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_gallery_items_image_idx" ON "cases_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "cases_blocks_gallery_order_idx" ON "cases_blocks_gallery" USING btree ("_order");
  CREATE INDEX "cases_blocks_gallery_parent_id_idx" ON "cases_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_gallery_path_idx" ON "cases_blocks_gallery" USING btree ("_path");
  CREATE INDEX "cases_blocks_video_order_idx" ON "cases_blocks_video" USING btree ("_order");
  CREATE INDEX "cases_blocks_video_parent_id_idx" ON "cases_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_video_path_idx" ON "cases_blocks_video" USING btree ("_path");
  CREATE INDEX "cases_blocks_video_video_idx" ON "cases_blocks_video" USING btree ("video_id");
  CREATE INDEX "cases_blocks_video_poster_idx" ON "cases_blocks_video" USING btree ("poster_id");
  CREATE INDEX "cases_blocks_quote_order_idx" ON "cases_blocks_quote" USING btree ("_order");
  CREATE INDEX "cases_blocks_quote_parent_id_idx" ON "cases_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_quote_path_idx" ON "cases_blocks_quote" USING btree ("_path");
  CREATE INDEX "cases_blocks_metric_grid_metrics_order_idx" ON "cases_blocks_metric_grid_metrics" USING btree ("_order");
  CREATE INDEX "cases_blocks_metric_grid_metrics_parent_id_idx" ON "cases_blocks_metric_grid_metrics" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_metric_grid_order_idx" ON "cases_blocks_metric_grid" USING btree ("_order");
  CREATE INDEX "cases_blocks_metric_grid_parent_id_idx" ON "cases_blocks_metric_grid" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_metric_grid_path_idx" ON "cases_blocks_metric_grid" USING btree ("_path");
  CREATE INDEX "cases_blocks_text_media_order_idx" ON "cases_blocks_text_media" USING btree ("_order");
  CREATE INDEX "cases_blocks_text_media_parent_id_idx" ON "cases_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_text_media_path_idx" ON "cases_blocks_text_media" USING btree ("_path");
  CREATE INDEX "cases_blocks_text_media_media_idx" ON "cases_blocks_text_media" USING btree ("media_id");
  CREATE INDEX "cases_blocks_sticky_text_steps_order_idx" ON "cases_blocks_sticky_text_steps" USING btree ("_order");
  CREATE INDEX "cases_blocks_sticky_text_steps_parent_id_idx" ON "cases_blocks_sticky_text_steps" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_sticky_text_steps_image_idx" ON "cases_blocks_sticky_text_steps" USING btree ("image_id");
  CREATE INDEX "cases_blocks_sticky_text_order_idx" ON "cases_blocks_sticky_text" USING btree ("_order");
  CREATE INDEX "cases_blocks_sticky_text_parent_id_idx" ON "cases_blocks_sticky_text" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_sticky_text_path_idx" ON "cases_blocks_sticky_text" USING btree ("_path");
  CREATE INDEX "cases_blocks_next_case_order_idx" ON "cases_blocks_next_case" USING btree ("_order");
  CREATE INDEX "cases_blocks_next_case_parent_id_idx" ON "cases_blocks_next_case" USING btree ("_parent_id");
  CREATE INDEX "cases_blocks_next_case_path_idx" ON "cases_blocks_next_case" USING btree ("_path");
  CREATE INDEX "cases_blocks_next_case_case_idx" ON "cases_blocks_next_case" USING btree ("case_id");
  CREATE INDEX "cases_metrics_order_idx" ON "cases_metrics" USING btree ("_order");
  CREATE INDEX "cases_metrics_parent_id_idx" ON "cases_metrics" USING btree ("_parent_id");
  CREATE INDEX "cases_project_team_order_idx" ON "cases_project_team" USING btree ("_order");
  CREATE INDEX "cases_project_team_parent_id_idx" ON "cases_project_team" USING btree ("_parent_id");
  CREATE INDEX "cases_project_team_person_idx" ON "cases_project_team" USING btree ("person_id");
  CREATE INDEX "cases_cover_idx" ON "cases" USING btree ("cover_id");
  CREATE INDEX "cases_hero_media_idx" ON "cases" USING btree ("hero_media_id");
  CREATE INDEX "cases_testimonial_testimonial_photo_idx" ON "cases" USING btree ("testimonial_photo_id");
  CREATE INDEX "cases_related_case_idx" ON "cases" USING btree ("related_case_id");
  CREATE INDEX "cases_seo_seo_image_idx" ON "cases" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "cases_slug_idx" ON "cases" USING btree ("slug");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  CREATE INDEX "cases__status_idx" ON "cases" USING btree ("_status");
  CREATE INDEX "cases_rels_order_idx" ON "cases_rels" USING btree ("order");
  CREATE INDEX "cases_rels_parent_idx" ON "cases_rels" USING btree ("parent_id");
  CREATE INDEX "cases_rels_path_idx" ON "cases_rels" USING btree ("path");
  CREATE INDEX "cases_rels_services_id_idx" ON "cases_rels" USING btree ("services_id");
  CREATE INDEX "cases_rels_categories_id_idx" ON "cases_rels" USING btree ("categories_id");
  CREATE INDEX "_cases_v_version_tags_order_idx" ON "_cases_v_version_tags" USING btree ("_order");
  CREATE INDEX "_cases_v_version_tags_parent_id_idx" ON "_cases_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_rich_text_order_idx" ON "_cases_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_rich_text_parent_id_idx" ON "_cases_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_rich_text_path_idx" ON "_cases_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_full_width_image_order_idx" ON "_cases_v_blocks_full_width_image" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_full_width_image_parent_id_idx" ON "_cases_v_blocks_full_width_image" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_full_width_image_path_idx" ON "_cases_v_blocks_full_width_image" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_full_width_image_image_idx" ON "_cases_v_blocks_full_width_image" USING btree ("image_id");
  CREATE INDEX "_cases_v_blocks_image_pair_order_idx" ON "_cases_v_blocks_image_pair" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_image_pair_parent_id_idx" ON "_cases_v_blocks_image_pair" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_image_pair_path_idx" ON "_cases_v_blocks_image_pair" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_image_pair_left_idx" ON "_cases_v_blocks_image_pair" USING btree ("left_id");
  CREATE INDEX "_cases_v_blocks_image_pair_right_idx" ON "_cases_v_blocks_image_pair" USING btree ("right_id");
  CREATE INDEX "_cases_v_blocks_gallery_items_order_idx" ON "_cases_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_gallery_items_parent_id_idx" ON "_cases_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_gallery_items_image_idx" ON "_cases_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_cases_v_blocks_gallery_order_idx" ON "_cases_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_gallery_parent_id_idx" ON "_cases_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_gallery_path_idx" ON "_cases_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_video_order_idx" ON "_cases_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_video_parent_id_idx" ON "_cases_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_video_path_idx" ON "_cases_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_video_video_idx" ON "_cases_v_blocks_video" USING btree ("video_id");
  CREATE INDEX "_cases_v_blocks_video_poster_idx" ON "_cases_v_blocks_video" USING btree ("poster_id");
  CREATE INDEX "_cases_v_blocks_quote_order_idx" ON "_cases_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_quote_parent_id_idx" ON "_cases_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_quote_path_idx" ON "_cases_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_metric_grid_metrics_order_idx" ON "_cases_v_blocks_metric_grid_metrics" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_metric_grid_metrics_parent_id_idx" ON "_cases_v_blocks_metric_grid_metrics" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_metric_grid_order_idx" ON "_cases_v_blocks_metric_grid" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_metric_grid_parent_id_idx" ON "_cases_v_blocks_metric_grid" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_metric_grid_path_idx" ON "_cases_v_blocks_metric_grid" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_text_media_order_idx" ON "_cases_v_blocks_text_media" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_text_media_parent_id_idx" ON "_cases_v_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_text_media_path_idx" ON "_cases_v_blocks_text_media" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_text_media_media_idx" ON "_cases_v_blocks_text_media" USING btree ("media_id");
  CREATE INDEX "_cases_v_blocks_sticky_text_steps_order_idx" ON "_cases_v_blocks_sticky_text_steps" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_sticky_text_steps_parent_id_idx" ON "_cases_v_blocks_sticky_text_steps" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_sticky_text_steps_image_idx" ON "_cases_v_blocks_sticky_text_steps" USING btree ("image_id");
  CREATE INDEX "_cases_v_blocks_sticky_text_order_idx" ON "_cases_v_blocks_sticky_text" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_sticky_text_parent_id_idx" ON "_cases_v_blocks_sticky_text" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_sticky_text_path_idx" ON "_cases_v_blocks_sticky_text" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_next_case_order_idx" ON "_cases_v_blocks_next_case" USING btree ("_order");
  CREATE INDEX "_cases_v_blocks_next_case_parent_id_idx" ON "_cases_v_blocks_next_case" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_blocks_next_case_path_idx" ON "_cases_v_blocks_next_case" USING btree ("_path");
  CREATE INDEX "_cases_v_blocks_next_case_case_idx" ON "_cases_v_blocks_next_case" USING btree ("case_id");
  CREATE INDEX "_cases_v_version_metrics_order_idx" ON "_cases_v_version_metrics" USING btree ("_order");
  CREATE INDEX "_cases_v_version_metrics_parent_id_idx" ON "_cases_v_version_metrics" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_version_project_team_order_idx" ON "_cases_v_version_project_team" USING btree ("_order");
  CREATE INDEX "_cases_v_version_project_team_parent_id_idx" ON "_cases_v_version_project_team" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_version_project_team_person_idx" ON "_cases_v_version_project_team" USING btree ("person_id");
  CREATE INDEX "_cases_v_parent_idx" ON "_cases_v" USING btree ("parent_id");
  CREATE INDEX "_cases_v_version_version_cover_idx" ON "_cases_v" USING btree ("version_cover_id");
  CREATE INDEX "_cases_v_version_version_hero_media_idx" ON "_cases_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_cases_v_version_testimonial_version_testimonial_photo_idx" ON "_cases_v" USING btree ("version_testimonial_photo_id");
  CREATE INDEX "_cases_v_version_version_related_case_idx" ON "_cases_v" USING btree ("version_related_case_id");
  CREATE INDEX "_cases_v_version_seo_version_seo_image_idx" ON "_cases_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_cases_v_version_version_slug_idx" ON "_cases_v" USING btree ("version_slug");
  CREATE INDEX "_cases_v_version_version_updated_at_idx" ON "_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_cases_v_version_version_created_at_idx" ON "_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_cases_v_version_version__status_idx" ON "_cases_v" USING btree ("version__status");
  CREATE INDEX "_cases_v_created_at_idx" ON "_cases_v" USING btree ("created_at");
  CREATE INDEX "_cases_v_updated_at_idx" ON "_cases_v" USING btree ("updated_at");
  CREATE INDEX "_cases_v_latest_idx" ON "_cases_v" USING btree ("latest");
  CREATE INDEX "_cases_v_rels_order_idx" ON "_cases_v_rels" USING btree ("order");
  CREATE INDEX "_cases_v_rels_parent_idx" ON "_cases_v_rels" USING btree ("parent_id");
  CREATE INDEX "_cases_v_rels_path_idx" ON "_cases_v_rels" USING btree ("path");
  CREATE INDEX "_cases_v_rels_services_id_idx" ON "_cases_v_rels" USING btree ("services_id");
  CREATE INDEX "_cases_v_rels_categories_id_idx" ON "_cases_v_rels" USING btree ("categories_id");
  CREATE INDEX "services_client_problems_order_idx" ON "services_client_problems" USING btree ("_order");
  CREATE INDEX "services_client_problems_parent_id_idx" ON "services_client_problems" USING btree ("_parent_id");
  CREATE INDEX "services_scope_order_idx" ON "services_scope" USING btree ("_order");
  CREATE INDEX "services_scope_parent_id_idx" ON "services_scope" USING btree ("_parent_id");
  CREATE INDEX "services_deliverables_order_idx" ON "services_deliverables" USING btree ("_order");
  CREATE INDEX "services_deliverables_parent_id_idx" ON "services_deliverables" USING btree ("_parent_id");
  CREATE INDEX "services_seo_seo_image_idx" ON "services" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_visual_idx" ON "services" USING btree ("visual_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_cases_id_idx" ON "services_rels" USING btree ("cases_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "team_links_order_idx" ON "team_links" USING btree ("_order");
  CREATE INDEX "team_links_parent_id_idx" ON "team_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "team_slug_idx" ON "team" USING btree ("slug");
  CREATE INDEX "team_photo_idx" ON "team" USING btree ("photo_id");
  CREATE INDEX "team_updated_at_idx" ON "team" USING btree ("updated_at");
  CREATE INDEX "team_created_at_idx" ON "team" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_portrait_sizes_portrait_filename_idx" ON "media" USING btree ("sizes_portrait_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_team_id_idx" ON "payload_locked_documents_rels" USING btree ("team_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_principles_order_idx" ON "site_settings_principles" USING btree ("_order");
  CREATE INDEX "site_settings_principles_parent_id_idx" ON "site_settings_principles" USING btree ("_parent_id");
  CREATE INDEX "site_settings_process_steps_order_idx" ON "site_settings_process_steps" USING btree ("_order");
  CREATE INDEX "site_settings_process_steps_parent_id_idx" ON "site_settings_process_steps" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_legal_links_order_idx" ON "site_settings_legal_links" USING btree ("_order");
  CREATE INDEX "site_settings_legal_links_parent_id_idx" ON "site_settings_legal_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_seo_seo_image_idx" ON "site_settings" USING btree ("seo_image_id");
  CREATE INDEX "navigation_header_order_idx" ON "navigation_header" USING btree ("_order");
  CREATE INDEX "navigation_header_parent_id_idx" ON "navigation_header" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_groups_links_order_idx" ON "navigation_footer_groups_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_links_parent_id_idx" ON "navigation_footer_groups_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_groups_order_idx" ON "navigation_footer_groups" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_parent_id_idx" ON "navigation_footer_groups" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cases_tags" CASCADE;
  DROP TABLE "cases_blocks_rich_text" CASCADE;
  DROP TABLE "cases_blocks_full_width_image" CASCADE;
  DROP TABLE "cases_blocks_image_pair" CASCADE;
  DROP TABLE "cases_blocks_gallery_items" CASCADE;
  DROP TABLE "cases_blocks_gallery" CASCADE;
  DROP TABLE "cases_blocks_video" CASCADE;
  DROP TABLE "cases_blocks_quote" CASCADE;
  DROP TABLE "cases_blocks_metric_grid_metrics" CASCADE;
  DROP TABLE "cases_blocks_metric_grid" CASCADE;
  DROP TABLE "cases_blocks_text_media" CASCADE;
  DROP TABLE "cases_blocks_sticky_text_steps" CASCADE;
  DROP TABLE "cases_blocks_sticky_text" CASCADE;
  DROP TABLE "cases_blocks_next_case" CASCADE;
  DROP TABLE "cases_metrics" CASCADE;
  DROP TABLE "cases_project_team" CASCADE;
  DROP TABLE "cases" CASCADE;
  DROP TABLE "cases_rels" CASCADE;
  DROP TABLE "_cases_v_version_tags" CASCADE;
  DROP TABLE "_cases_v_blocks_rich_text" CASCADE;
  DROP TABLE "_cases_v_blocks_full_width_image" CASCADE;
  DROP TABLE "_cases_v_blocks_image_pair" CASCADE;
  DROP TABLE "_cases_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_cases_v_blocks_gallery" CASCADE;
  DROP TABLE "_cases_v_blocks_video" CASCADE;
  DROP TABLE "_cases_v_blocks_quote" CASCADE;
  DROP TABLE "_cases_v_blocks_metric_grid_metrics" CASCADE;
  DROP TABLE "_cases_v_blocks_metric_grid" CASCADE;
  DROP TABLE "_cases_v_blocks_text_media" CASCADE;
  DROP TABLE "_cases_v_blocks_sticky_text_steps" CASCADE;
  DROP TABLE "_cases_v_blocks_sticky_text" CASCADE;
  DROP TABLE "_cases_v_blocks_next_case" CASCADE;
  DROP TABLE "_cases_v_version_metrics" CASCADE;
  DROP TABLE "_cases_v_version_project_team" CASCADE;
  DROP TABLE "_cases_v" CASCADE;
  DROP TABLE "_cases_v_rels" CASCADE;
  DROP TABLE "services_client_problems" CASCADE;
  DROP TABLE "services_scope" CASCADE;
  DROP TABLE "services_deliverables" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "team_links" CASCADE;
  DROP TABLE "team" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_principles" CASCADE;
  DROP TABLE "site_settings_process_steps" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings_legal_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "navigation_header" CASCADE;
  DROP TABLE "navigation_footer_groups_links" CASCADE;
  DROP TABLE "navigation_footer_groups" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."enum_cases_blocks_rich_text_width";
  DROP TYPE "public"."enum_cases_blocks_image_pair_ratio";
  DROP TYPE "public"."enum_cases_blocks_gallery_columns";
  DROP TYPE "public"."enum_cases_blocks_text_media_media_position";
  DROP TYPE "public"."enum_cases_status";
  DROP TYPE "public"."enum__cases_v_blocks_rich_text_width";
  DROP TYPE "public"."enum__cases_v_blocks_image_pair_ratio";
  DROP TYPE "public"."enum__cases_v_blocks_gallery_columns";
  DROP TYPE "public"."enum__cases_v_blocks_text_media_media_position";
  DROP TYPE "public"."enum__cases_v_version_status";
  DROP TYPE "public"."enum_services_stage";
  DROP TYPE "public"."enum_services_icon";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_users_role";`)
}
