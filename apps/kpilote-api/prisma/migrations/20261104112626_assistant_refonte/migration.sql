-- AlterTable
ALTER TABLE "assistant_appel" DROP COLUMN "surface",
ADD COLUMN     "outils" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "assistant_conversation" DROP COLUMN "surface";

-- CreateTable
CREATE TABLE "assistant_sous_appel" (
    "id" UUID NOT NULL,
    "appel_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "duree_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_sous_appel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_sous_appel_appel_id_idx" ON "assistant_sous_appel"("appel_id");

-- AddForeignKey
ALTER TABLE "assistant_sous_appel" ADD CONSTRAINT "assistant_sous_appel_appel_id_fkey" FOREIGN KEY ("appel_id") REFERENCES "assistant_appel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

