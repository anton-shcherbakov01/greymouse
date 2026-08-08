import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_enabled" boolean DEFAULT true;
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_eyebrow" varchar DEFAULT 'Продуктовая лаборатория';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_title" varchar DEFAULT 'Не картинка, а рабочий продукт.';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_description" varchar DEFAULT 'Интерактивный пульт собственника: выручка, воронка, команда и сделки под риском. Можно открыть и проверить прямо здесь.';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_company_name" varchar DEFAULT 'Вектор Трейд';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_cta_label" varchar DEFAULT 'Открыть на весь экран';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_note" varchar DEFAULT 'Демо-данные · интерфейс интерактивный';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_enabled";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_eyebrow";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_title";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_description";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_company_name";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_cta_label";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_note";
  `)
}
