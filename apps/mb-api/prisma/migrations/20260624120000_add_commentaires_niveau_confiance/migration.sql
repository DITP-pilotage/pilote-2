-- Socle Commentaire + satellites par secteur (IndicateurIndividu, PanierIndividu, Panier)
-- + NiveauConfiance (météo) accroché 1:n à un commentaire (historique d'indices + autres usages).

-- CreateEnum
CREATE TYPE "commentaire_statut_enum" AS ENUM ('BROUILLON', 'PUBLIE');
CREATE TYPE "indice_confiance_enum" AS ENUM ('OBJECTIF_COMPROMIS', 'APPUIS_NECESSAIRE', 'OBJECTIF_ATTEIGNABLE', 'OBJECTIF_SECURISE');
CREATE TYPE "indicateur_individu_commentaire_type_enum" AS ENUM ('DEFAUT', 'CONFIANCE');
CREATE TYPE "panier_individu_commentaire_type_enum" AS ENUM ('DEFAUT', 'CONFIANCE');
CREATE TYPE "panier_commentaire_type_enum" AS ENUM ('DEFAUT', 'CONFIANCE', 'OBJECTIF');

-- CreateTable : socle
CREATE TABLE "commentaire" (
    "id"            UUID                      NOT NULL,
    "contenu"       TEXT                      NOT NULL,
    "contenu_texte" TEXT                      NOT NULL,
    "statut"        "commentaire_statut_enum" NOT NULL,
    "created_by"    UUID                      NOT NULL,
    "updated_by"    UUID                      NOT NULL,
    "created_at"    TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3)              NOT NULL,
    CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "commentaire_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "commentaire_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "commentaire_created_by_idx" ON "commentaire"("created_by");
CREATE INDEX "commentaire_updated_by_idx" ON "commentaire"("updated_by");

-- CreateTable : satellite IndicateurIndividu
CREATE TABLE "indicateur_individu_commentaire" (
    "commentaire_id" UUID                                NOT NULL,
    "indicateur_id"  UUID                                NOT NULL,
    "individu_id"    UUID                                NOT NULL,
    "type"           "indicateur_individu_commentaire_type_enum" NOT NULL,
    CONSTRAINT "indicateur_individu_commentaire_pkey" PRIMARY KEY ("commentaire_id"),
    CONSTRAINT "indicateur_individu_commentaire_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicateur_individu_commentaire_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicateur_individu_commentaire_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "indicateur_individu_commentaire_indicateur_id_individu_id_idx" ON "indicateur_individu_commentaire"("indicateur_id", "individu_id");

-- CreateTable : satellite PanierIndividu
CREATE TABLE "panier_individu_commentaire" (
    "commentaire_id" UUID                            NOT NULL,
    "panier_id"      UUID                            NOT NULL,
    "individu_id"    UUID                            NOT NULL,
    "type"           "panier_individu_commentaire_type_enum" NOT NULL,
    CONSTRAINT "panier_individu_commentaire_pkey" PRIMARY KEY ("commentaire_id"),
    CONSTRAINT "panier_individu_commentaire_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "panier_individu_commentaire_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "panier_individu_commentaire_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "panier_individu_commentaire_panier_id_individu_id_idx" ON "panier_individu_commentaire"("panier_id", "individu_id");

-- CreateTable : satellite Panier (global, sans individu)
CREATE TABLE "panier_commentaire" (
    "commentaire_id" UUID                    NOT NULL,
    "panier_id"      UUID                    NOT NULL,
    "type"           "panier_commentaire_type_enum" NOT NULL,
    CONSTRAINT "panier_commentaire_pkey" PRIMARY KEY ("commentaire_id"),
    CONSTRAINT "panier_commentaire_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "panier_commentaire_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "panier_commentaire_panier_id_idx" ON "panier_commentaire"("panier_id");

-- CreateTable : NiveauConfiance (météo), 1:n sur le commentaire (historique d'indices)
CREATE TABLE "niveau_confiance" (
    "id"             UUID                    NOT NULL,
    "commentaire_id" UUID                    NOT NULL,
    "indice"         "indice_confiance_enum" NOT NULL,
    "created_at"     TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)            NOT NULL,
    CONSTRAINT "niveau_confiance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "niveau_confiance_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "niveau_confiance_commentaire_id_idx" ON "niveau_confiance"("commentaire_id");
