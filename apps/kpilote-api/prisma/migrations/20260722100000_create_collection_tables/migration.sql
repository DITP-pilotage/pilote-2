-- Renommage du concept "panier" → "collection" (étape 1/3 : création des nouvelles tables).
-- Les tables collection_* sont créées à côté des tables panier_* existantes.
-- La copie des données puis la suppression des anciennes tables sont réalisées
-- dans les deux migrations suivantes.

-- CreateEnum
CREATE TYPE "collection_commentaire_type_enum" AS ENUM ('DEFAUT', 'CONFIANCE', 'OBJECTIF');

-- CreateTable
CREATE TABLE "collection" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "visibilite" "visibilite_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_permission" (
    "principal_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "action" "permission_action_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_permission_pkey" PRIMARY KEY ("principal_id","collection_id","action")
);

-- CreateTable
CREATE TABLE "collection_indicateur" (
    "collection_id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "ponderation" DECIMAL(20,2) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_indicateur_pkey" PRIMARY KEY ("collection_id","indicateur_id")
);

-- CreateTable
CREATE TABLE "collection_responsable" (
    "collection_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_responsable_pkey" PRIMARY KEY ("collection_id","utilisateur_id")
);

-- CreateTable
CREATE TABLE "collection_contact_utile" (
    "collection_id" UUID NOT NULL,
    "contact_utile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_contact_utile_pkey" PRIMARY KEY ("collection_id","contact_utile_id")
);

-- CreateTable
CREATE TABLE "collection_commentaire" (
    "commentaire_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "type" "collection_commentaire_type_enum" NOT NULL,

    CONSTRAINT "collection_commentaire_pkey" PRIMARY KEY ("commentaire_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_public_id_key" ON "collection"("public_id");

-- CreateIndex
CREATE INDEX "collection_permission_collection_id_idx" ON "collection_permission"("collection_id");

-- CreateIndex
CREATE INDEX "collection_indicateur_collection_id_created_at_idx" ON "collection_indicateur"("collection_id", "created_at");

-- CreateIndex
CREATE INDEX "collection_responsable_collection_id_created_at_idx" ON "collection_responsable"("collection_id", "created_at");

-- CreateIndex
CREATE INDEX "collection_contact_utile_collection_id_idx" ON "collection_contact_utile"("collection_id");

-- CreateIndex
CREATE INDEX "collection_commentaire_collection_id_idx" ON "collection_commentaire"("collection_id");

-- AddForeignKey
ALTER TABLE "collection_permission" ADD CONSTRAINT "collection_permission_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_permission" ADD CONSTRAINT "collection_permission_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_indicateur" ADD CONSTRAINT "collection_indicateur_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_indicateur" ADD CONSTRAINT "collection_indicateur_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_responsable" ADD CONSTRAINT "collection_responsable_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_responsable" ADD CONSTRAINT "collection_responsable_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_contact_utile" ADD CONSTRAINT "collection_contact_utile_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_contact_utile" ADD CONSTRAINT "collection_contact_utile_contact_utile_id_fkey" FOREIGN KEY ("contact_utile_id") REFERENCES "contact_utile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_commentaire" ADD CONSTRAINT "collection_commentaire_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_commentaire" ADD CONSTRAINT "collection_commentaire_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
