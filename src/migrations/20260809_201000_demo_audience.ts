import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Блок «кому это нужно» под демо: посетителю нужно за секунду понять, про него
 * этот дашборд или нет.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_audience_title" varchar DEFAULT 'Кому это нужно';
    ALTER TABLE "site_settings" ADD COLUMN "demo_showcase_audience" varchar DEFAULT 'Селлерам на маркетплейсах
Владельцам кофеен, магазинов, салонов
Репетиторам и небольшим школам
Сервисам и студиям с постоянными клиентами
Любому делу, где сделки ведут в таблице';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_audience_title";
    ALTER TABLE "site_settings" DROP COLUMN "demo_showcase_audience";
  `)
}
