-- POC dimensions : l'individu devient une dimension comme une autre.
-- Cf. docs/architecture/dimensions-design.md (§ Décision, § Migration).
--
-- 1. Dimension : chaque référentiel devient un niveau d'une dimension. Les
--    dimensions sont déduites par union-find : deux référentiels sont dans la
--    même dimension s'ils sont reliés par une Relation entre leurs individus OU
--    co-déclarés sur un même indicateur. Garantit que tout indicateur existant
--    reste mono-dimension (des référentiels « alternatifs » restent ensemble).
-- 2. indicateur_dimension : une ligne par indicateur (ordre 0, SUM, objectifs).
-- 3. cellule : une cellule mono-coordonnée par (indicateur, individu) observé ;
--    valeurs, objectifs et commentaires basculent de individu_id vers cellule_id.
-- 4. Périmètres de permission (cloisonnement par membre de dimension).

-- 1. Dimensions -------------------------------------------------------------

CREATE TABLE "dimension" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dimension_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dimension_public_id_key" ON "dimension"("public_id");

ALTER TABLE "referentiel" ADD COLUMN "dimension_id" UUID;

CREATE TEMP TABLE "_ref_composante" AS
SELECT "id" AS "referentiel_id", "id"::text AS "composante" FROM "referentiel";

CREATE TEMP TABLE "_ref_lien" AS
SELECT DISTINCT ip."referentiel_id" AS "a", ic."referentiel_id" AS "b"
FROM "relation" r
JOIN "individu" ip ON ip."id" = r."parent_id"
JOIN "individu" ic ON ic."id" = r."child_id"
WHERE ip."referentiel_id" <> ic."referentiel_id"
UNION
SELECT x."referentiel_id", y."referentiel_id"
FROM "indicateur_referentiel" x
JOIN "indicateur_referentiel" y
  ON y."indicateur_id" = x."indicateur_id" AND y."referentiel_id" <> x."referentiel_id";

-- Propagation du plus petit identifiant de composante jusqu'à point fixe.
DO $$
DECLARE
  nb_modifies integer;
BEGIN
  LOOP
    UPDATE "_ref_composante" c
    SET "composante" = m."min_composante"
    FROM (
      SELECT l."a" AS "referentiel_id", min(v."composante") AS "min_composante"
      FROM (SELECT "a", "b" FROM "_ref_lien" UNION SELECT "b", "a" FROM "_ref_lien") l
      JOIN "_ref_composante" v ON v."referentiel_id" = l."b"
      GROUP BY l."a"
    ) m
    WHERE c."referentiel_id" = m."referentiel_id" AND m."min_composante" < c."composante";
    GET DIAGNOSTICS nb_modifies = ROW_COUNT;
    EXIT WHEN nb_modifies = 0;
  END LOOP;
END $$;

CREATE TEMP TABLE "_dimension" AS
SELECT "composante", gen_random_uuid() AS "dimension_id"
FROM (SELECT DISTINCT "composante" FROM "_ref_composante") t;

INSERT INTO "dimension" ("id", "public_id", "nom", "description", "created_at", "updated_at")
SELECT
  d."dimension_id",
  'DIM-' || left(regexp_replace(rep."public_id", '^REF-', ''), 16),
  (
    SELECT string_agg(r."nom", ' / ' ORDER BY (
      SELECT count(*) FROM "individu" i WHERE i."referentiel_id" = r."id"
    ), r."public_id")
    FROM "referentiel" r
    JOIN "_ref_composante" c ON c."referentiel_id" = r."id"
    WHERE c."composante" = d."composante"
  ),
  'Dimension créée par migration (regroupement des référentiels reliés).',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "_dimension" d
JOIN "referentiel" rep ON rep."id"::text = d."composante";

UPDATE "referentiel" r
SET "dimension_id" = d."dimension_id"
FROM "_ref_composante" c
JOIN "_dimension" d ON d."composante" = c."composante"
WHERE c."referentiel_id" = r."id";

ALTER TABLE "referentiel" ALTER COLUMN "dimension_id" SET NOT NULL;
CREATE INDEX "referentiel_dimension_id_idx" ON "referentiel"("dimension_id");
ALTER TABLE "referentiel" ADD CONSTRAINT "referentiel_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Configuration des dimensions par indicateur ----------------------------

CREATE TABLE "indicateur_dimension" (
    "indicateur_id" UUID NOT NULL,
    "dimension_id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "fonction_agregation" "fonction_agregation_enum" NOT NULL,
    "porte_objectifs" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicateur_dimension_pkey" PRIMARY KEY ("indicateur_id","dimension_id")
);
CREATE INDEX "indicateur_dimension_dimension_id_idx" ON "indicateur_dimension"("dimension_id");
CREATE UNIQUE INDEX "indicateur_dimension_indicateur_id_ordre_key" ON "indicateur_dimension"("indicateur_id", "ordre");
ALTER TABLE "indicateur_dimension" ADD CONSTRAINT "indicateur_dimension_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "indicateur_dimension" ADD CONSTRAINT "indicateur_dimension_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Par construction (union-find sur la co-déclaration), un indicateur existant a
-- exactement une dimension.
INSERT INTO "indicateur_dimension" ("indicateur_id", "dimension_id", "ordre", "fonction_agregation", "porte_objectifs", "created_at", "updated_at")
SELECT DISTINCT ir."indicateur_id", r."dimension_id", 0, 'SUM'::"fonction_agregation_enum", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "indicateur_referentiel" ir
JOIN "referentiel" r ON r."id" = ir."referentiel_id";

-- 3. Cellules ---------------------------------------------------------------

CREATE TABLE "cellule" (
    "id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "cle" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cellule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cellule_indicateur_id_cle_key" ON "cellule"("indicateur_id", "cle");
CREATE UNIQUE INDEX "cellule_id_indicateur_id_key" ON "cellule"("id", "indicateur_id");
ALTER TABLE "cellule" ADD CONSTRAINT "cellule_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "cellule_coordonnee" (
    "cellule_id" UUID NOT NULL,
    "dimension_id" UUID NOT NULL,
    "individu_id" UUID NOT NULL,

    CONSTRAINT "cellule_coordonnee_pkey" PRIMARY KEY ("cellule_id","dimension_id")
);
CREATE INDEX "cellule_coordonnee_individu_id_idx" ON "cellule_coordonnee"("individu_id");
ALTER TABLE "cellule_coordonnee" ADD CONSTRAINT "cellule_coordonnee_cellule_id_fkey" FOREIGN KEY ("cellule_id") REFERENCES "cellule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cellule_coordonnee" ADD CONSTRAINT "cellule_coordonnee_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cellule_coordonnee" ADD CONSTRAINT "cellule_coordonnee_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cellule mono-coordonnée : cle = uuid de l'individu (format texte Postgres,
-- minuscules, identique à la sérialisation JS).
INSERT INTO "cellule" ("id", "indicateur_id", "cle", "created_at")
SELECT gen_random_uuid(), s."indicateur_id", s."individu_id"::text, CURRENT_TIMESTAMP
FROM (
  SELECT "indicateur_id", "individu_id" FROM "valeur_avancement"
  UNION
  SELECT "indicateur_id", "individu_id" FROM "objectif_indicateur_individu"
  UNION
  SELECT "indicateur_id", "individu_id" FROM "indicateur_individu_commentaire"
) s;

INSERT INTO "cellule_coordonnee" ("cellule_id", "dimension_id", "individu_id")
SELECT c."id", r."dimension_id", i."id"
FROM "cellule" c
JOIN "individu" i ON i."id"::text = c."cle"
JOIN "referentiel" r ON r."id" = i."referentiel_id";

-- valeur_avancement
ALTER TABLE "valeur_avancement" ADD COLUMN "cellule_id" UUID;
UPDATE "valeur_avancement" v
SET "cellule_id" = c."id"
FROM "cellule" c
WHERE c."indicateur_id" = v."indicateur_id" AND c."cle" = v."individu_id"::text;
ALTER TABLE "valeur_avancement" ALTER COLUMN "cellule_id" SET NOT NULL;
ALTER TABLE "valeur_avancement" DROP CONSTRAINT "valeur_avancement_individu_id_fkey";
DROP INDEX "valeur_avancement_indicateur_id_individu_id_date_key";
DROP INDEX "valeur_avancement_individu_id_date_idx";
ALTER TABLE "valeur_avancement" DROP COLUMN "individu_id";
CREATE INDEX "valeur_avancement_cellule_id_date_idx" ON "valeur_avancement"("cellule_id", "date");
CREATE UNIQUE INDEX "valeur_avancement_indicateur_id_cellule_id_date_key" ON "valeur_avancement"("indicateur_id", "cellule_id", "date");
ALTER TABLE "valeur_avancement" ADD CONSTRAINT "valeur_avancement_cellule_id_indicateur_id_fkey" FOREIGN KEY ("cellule_id", "indicateur_id") REFERENCES "cellule"("id", "indicateur_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- objectif_indicateur_individu
ALTER TABLE "objectif_indicateur_individu" ADD COLUMN "cellule_id" UUID;
UPDATE "objectif_indicateur_individu" o
SET "cellule_id" = c."id"
FROM "cellule" c
WHERE c."indicateur_id" = o."indicateur_id" AND c."cle" = o."individu_id"::text;
ALTER TABLE "objectif_indicateur_individu" ALTER COLUMN "cellule_id" SET NOT NULL;
ALTER TABLE "objectif_indicateur_individu" DROP CONSTRAINT "objectif_indicateur_individu_individu_id_fkey";
DROP INDEX "objectif_indicateur_individu_indicateur_id_individu_id_date_key";
DROP INDEX "objectif_indicateur_individu_indicateur_id_individu_id_idx";
ALTER TABLE "objectif_indicateur_individu" DROP COLUMN "individu_id";
CREATE INDEX "objectif_indicateur_individu_indicateur_id_cellule_id_idx" ON "objectif_indicateur_individu"("indicateur_id", "cellule_id");
CREATE UNIQUE INDEX "objectif_indicateur_individu_indicateur_id_cellule_id_date__key" ON "objectif_indicateur_individu"("indicateur_id", "cellule_id", "date_cible");
ALTER TABLE "objectif_indicateur_individu" ADD CONSTRAINT "objectif_indicateur_individu_cellule_id_indicateur_id_fkey" FOREIGN KEY ("cellule_id", "indicateur_id") REFERENCES "cellule"("id", "indicateur_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- indicateur_individu_commentaire
ALTER TABLE "indicateur_individu_commentaire" ADD COLUMN "cellule_id" UUID;
UPDATE "indicateur_individu_commentaire" ic
SET "cellule_id" = c."id"
FROM "cellule" c
WHERE c."indicateur_id" = ic."indicateur_id" AND c."cle" = ic."individu_id"::text;
ALTER TABLE "indicateur_individu_commentaire" ALTER COLUMN "cellule_id" SET NOT NULL;
ALTER TABLE "indicateur_individu_commentaire" DROP CONSTRAINT "indicateur_individu_commentaire_individu_id_fkey";
DROP INDEX "indicateur_individu_commentaire_indicateur_id_individu_id_idx";
ALTER TABLE "indicateur_individu_commentaire" DROP COLUMN "individu_id";
CREATE INDEX "indicateur_individu_commentaire_indicateur_id_cellule_id_idx" ON "indicateur_individu_commentaire"("indicateur_id", "cellule_id");
ALTER TABLE "indicateur_individu_commentaire" ADD CONSTRAINT "indicateur_individu_commentaire_cellule_id_indicateur_id_fkey" FOREIGN KEY ("cellule_id", "indicateur_id") REFERENCES "cellule"("id", "indicateur_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- 4. Périmètres de permission -----------------------------------------------

ALTER TABLE "indicateur_permission" ADD COLUMN "perimetre_restreint" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "indicateur_permission_perimetre" (
    "principal_id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "action" "indicateur_permission_action_enum" NOT NULL,
    "individu_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_permission_perimetre_pkey" PRIMARY KEY ("principal_id","indicateur_id","action","individu_id")
);
CREATE INDEX "indicateur_permission_perimetre_indicateur_id_idx" ON "indicateur_permission_perimetre"("indicateur_id");
ALTER TABLE "indicateur_permission_perimetre" ADD CONSTRAINT "indicateur_permission_perimetre_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "indicateur_permission_perimetre" ADD CONSTRAINT "indicateur_permission_perimetre_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "indicateur_permission_perimetre" ADD CONSTRAINT "indicateur_permission_perimetre_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "_ref_composante";
DROP TABLE "_ref_lien";
DROP TABLE "_dimension";
