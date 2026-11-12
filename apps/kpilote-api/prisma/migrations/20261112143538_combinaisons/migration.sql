-- Combinaisons de modalités sur les valeurs (multifiltre, PIL-1987).

-- 1. Combinaisons et combinaison vide ---------------------------------------

CREATE TABLE "combinaison" (
    "id" UUID NOT NULL,
    "cle" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combinaison_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "combinaison_cle_key" ON "combinaison"("cle");

-- La combinaison vide (aucune modalité) porte les valeurs des indicateurs sans
-- axe. Le code la retrouve par sa clé, pas par son id.
INSERT INTO "combinaison" ("id", "cle") VALUES (gen_random_uuid(), '');

-- 2. Modalités d'une combinaison --------------------------------------------

-- Cible de la clé étrangère composite ci-dessous.
CREATE UNIQUE INDEX "modalite_id_axe_id_key" ON "modalite"("id", "axe_id");

CREATE TABLE "combinaison_modalite" (
    "combinaison_id" UUID NOT NULL,
    "axe_id" UUID NOT NULL,
    "modalite_id" UUID NOT NULL,

    CONSTRAINT "combinaison_modalite_pkey" PRIMARY KEY ("combinaison_id","axe_id")
);

CREATE INDEX "combinaison_modalite_modalite_id_idx" ON "combinaison_modalite"("modalite_id");

ALTER TABLE "combinaison_modalite" ADD CONSTRAINT "combinaison_modalite_combinaison_id_fkey" FOREIGN KEY ("combinaison_id") REFERENCES "combinaison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "combinaison_modalite" ADD CONSTRAINT "combinaison_modalite_axe_id_fkey" FOREIGN KEY ("axe_id") REFERENCES "axe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- La modalité appartient à l'axe de la ligne.
ALTER TABLE "combinaison_modalite" ADD CONSTRAINT "combinaison_modalite_modalite_id_axe_id_fkey" FOREIGN KEY ("modalite_id", "axe_id") REFERENCES "modalite"("id", "axe_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Combinaison des valeurs : les valeurs existantes prennent la vide ------

ALTER TABLE "valeur_avancement" ADD COLUMN "combinaison_id" UUID;

UPDATE "valeur_avancement"
SET "combinaison_id" = (SELECT "id" FROM "combinaison" WHERE "cle" = '');

ALTER TABLE "valeur_avancement" ALTER COLUMN "combinaison_id" SET NOT NULL;

ALTER TABLE "valeur_avancement" ADD CONSTRAINT "valeur_avancement_combinaison_id_fkey" FOREIGN KEY ("combinaison_id") REFERENCES "combinaison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nouvelle clé d'une valeur ; l'ancienne (sans combinaison) part en PIL-1989.
CREATE UNIQUE INDEX "valeur_avancement_indicateur_id_individu_id_combinaison_id__key" ON "valeur_avancement"("indicateur_id", "individu_id", "combinaison_id", "date");
