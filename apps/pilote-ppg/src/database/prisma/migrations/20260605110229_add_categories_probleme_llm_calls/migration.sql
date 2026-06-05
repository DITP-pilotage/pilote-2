-- CreateEnum
CREATE TYPE "public"."llm_call_categorie_probleme" AS ENUM ('PROBLEME_TECHNIQUE', 'INCOMPREHENSION', 'SUGGESTION', 'AUTRE');

-- AlterTable
ALTER TABLE "public"."llm_calls" ADD COLUMN "categories_probleme" "public"."llm_call_categorie_probleme"[] DEFAULT ARRAY[]::"public"."llm_call_categorie_probleme"[];
