-- CreateEnum
CREATE TYPE "assistant_evaluation_enum" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "assistant_categorie_probleme_enum" AS ENUM ('PROBLEME_TECHNIQUE', 'INCOMPREHENSION', 'SUGGESTION', 'AUTRE');

-- CreateTable
CREATE TABLE "assistant_conversation" (
    "id" UUID NOT NULL,
    "principal_id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "contexte" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_appel" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "principal_id" UUID NOT NULL,
    "modele" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "transcript" JSONB NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "duree_ms" INTEGER NOT NULL DEFAULT 0,
    "evaluation" "assistant_evaluation_enum",
    "categories_probleme" "assistant_categorie_probleme_enum"[] DEFAULT ARRAY[]::"assistant_categorie_probleme_enum"[],
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_appel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_conversation_principal_id_updated_at_idx" ON "assistant_conversation"("principal_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "assistant_conversation_updated_at_idx" ON "assistant_conversation"("updated_at");

-- CreateIndex
CREATE INDEX "assistant_appel_conversation_id_created_at_idx" ON "assistant_appel"("conversation_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "assistant_appel" ADD CONSTRAINT "assistant_appel_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
