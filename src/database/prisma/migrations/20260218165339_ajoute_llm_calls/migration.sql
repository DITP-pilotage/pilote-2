-- CreateEnum
CREATE TYPE "public"."llm_call_evaluation" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateTable
CREATE TABLE "public"."llm_calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" UUID NOT NULL,
    "transcript" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "evaluation" "public"."llm_call_evaluation",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_calls_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."llm_calls" ADD CONSTRAINT "llm_calls_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
