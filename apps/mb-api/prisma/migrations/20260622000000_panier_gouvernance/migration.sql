-- AlterTable
ALTER TABLE "utilisateur"
  ADD COLUMN "nom"      TEXT NOT NULL,
  ADD COLUMN "prenom"   TEXT NOT NULL,
  ADD COLUMN "service"  TEXT NOT NULL,
  ADD COLUMN "fonction" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "panier_responsable" (
  "panier_id"      UUID        NOT NULL,
  "utilisateur_id" UUID        NOT NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "panier_responsable_pkey" PRIMARY KEY ("panier_id", "utilisateur_id")
);

-- CreateIndex
CREATE INDEX "panier_responsable_panier_id_created_at_idx"
  ON "panier_responsable" ("panier_id", "created_at");

-- AddForeignKey
ALTER TABLE "panier_responsable"
  ADD CONSTRAINT "panier_responsable_panier_id_fkey"
  FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panier_responsable"
  ADD CONSTRAINT "panier_responsable_utilisateur_id_fkey"
  FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
