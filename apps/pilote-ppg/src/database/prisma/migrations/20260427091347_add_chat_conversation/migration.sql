-- AlterTable
ALTER TABLE "public"."llm_calls" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."chat_conversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "contexte" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_conversation_utilisateur_id_updated_at_idx" ON "public"."chat_conversation"("utilisateur_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversation_updated_at_idx" ON "public"."chat_conversation"("updated_at");
