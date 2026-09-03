-- AlterTable
ALTER TABLE "public"."llm_calls" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- les lignes existantes n'ont jamais ete modifiees : leur date de modification est leur date de creation
UPDATE "public"."llm_calls" SET "updated_at" = "created_at";
