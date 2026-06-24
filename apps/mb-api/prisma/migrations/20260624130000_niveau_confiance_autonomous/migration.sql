-- NiveauConfiance devient une entité autonome avec ses propres auteurs
-- (created_by, updated_by → principal). Relation 1:n avec Commentaire conservée
-- (historique d'indices), mais chaque record a maintenant son id propre exposé.

-- 1) Ajout colonnes nullable puis backfill depuis le commentaire parent
ALTER TABLE "niveau_confiance"
  ADD COLUMN "created_by" UUID,
  ADD COLUMN "updated_by" UUID;

UPDATE "niveau_confiance" AS nc
SET    "created_by" = c."created_by",
       "updated_by" = c."updated_by"
FROM   "commentaire" AS c
WHERE  c."id" = nc."commentaire_id";

ALTER TABLE "niveau_confiance"
  ALTER COLUMN "created_by" SET NOT NULL,
  ALTER COLUMN "updated_by" SET NOT NULL;

-- 2) Indexes et FK sur les auteurs
CREATE INDEX "niveau_confiance_created_by_idx" ON "niveau_confiance"("created_by");
CREATE INDEX "niveau_confiance_updated_by_idx" ON "niveau_confiance"("updated_by");

ALTER TABLE "niveau_confiance"
  ADD CONSTRAINT "niveau_confiance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "niveau_confiance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
