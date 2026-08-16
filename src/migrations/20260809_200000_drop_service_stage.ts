import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Услуги больше не разбиты по этапам жизненного цикла: этапов было больше, чем
 * услуг, и секция на одну карточку читалась как «здесь всё». Порядок теперь
 * задаётся только полем «Порядок».
 *
 * Таблица версий трогается через проверку `to_regclass`: у услуг черновики не
 * включены, и на чистой базе `_services_v` нет вовсе — `DROP COLUMN IF EXISTS`
 * от отсутствующей таблицы не спасает, миграция падала бы целиком.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" DROP COLUMN IF EXISTS "stage";

    DO $$
    BEGIN
      IF to_regclass('public._services_v') IS NOT NULL THEN
        ALTER TABLE "_services_v" DROP COLUMN IF EXISTS "version_stage";
      END IF;
    END $$;

    DROP TYPE IF EXISTS "public"."enum_services_stage";
    DROP TYPE IF EXISTS "public"."enum__services_v_version_stage";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_services_stage" AS ENUM('research', 'design', 'development', 'growth', 'ai');
    ALTER TABLE "services" ADD COLUMN "stage" "public"."enum_services_stage" DEFAULT 'design' NOT NULL;

    DO $$
    BEGIN
      IF to_regclass('public._services_v') IS NOT NULL THEN
        CREATE TYPE "public"."enum__services_v_version_stage" AS ENUM('research', 'design', 'development', 'growth', 'ai');
        ALTER TABLE "_services_v" ADD COLUMN "version_stage" "public"."enum__services_v_version_stage" DEFAULT 'design';
      END IF;
    END $$;
  `)
}
