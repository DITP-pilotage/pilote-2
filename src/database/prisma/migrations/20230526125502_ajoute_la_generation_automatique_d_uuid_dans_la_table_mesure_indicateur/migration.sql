
-- AlterTable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE "raw_data"."mesure_indicateur" ALTER COLUMN "id" SET DEFAULT uuid_generate_v1();
ALTER TABLE "raw_data"."mesure_indicateur" ALTER COLUMN "rapport_id" SET DEFAULT uuid_generate_v1();

