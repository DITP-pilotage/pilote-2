-- Les valeurs acceptées de zg_applicable proviennent désormais exclusivement
-- du référentiel metadata_zonegroup : les lignes héritées de l'ancien
-- mécanisme de saisie libre n'ont plus lieu d'être.
DELETE FROM "public"."metadata_indicateur_valeur_acceptee"
WHERE "metadata_indicateur_name" = 'zg_applicable';

-- Nettoyage préalable : toute valeur de zg_applicable qui ne correspond à
-- aucun zone-groupe réel (ancien mécanisme de saisie libre, y compris la
-- chaîne vide historique de l'option "Toutes zones") est mise à NULL avant
-- la pose de la contrainte de clé étrangère.
UPDATE "raw_data"."metadata_indicateurs"
SET "zg_applicable" = NULL
WHERE "zg_applicable" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_zonegroup" AS zonegroup
    WHERE zonegroup."zone_group_id" = "metadata_indicateurs"."zg_applicable"
  );

UPDATE "raw_data"."metadata_indicateurs_hidden"
SET "zg_applicable" = NULL
WHERE "zg_applicable" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_zonegroup" AS zonegroup
    WHERE zonegroup."zone_group_id" = "metadata_indicateurs_hidden"."zg_applicable"
  );

-- Contraintes de clé étrangère, sur le modèle de fk_chantier_zonegroup
-- (migration 20260806100000_metadata_chantiers_array_fields)
ALTER TABLE "raw_data"."metadata_indicateurs"
ADD CONSTRAINT "fk_indicateur_zonegroup" FOREIGN KEY ("zg_applicable") REFERENCES "raw_data"."metadata_zonegroup" ("zone_group_id");

ALTER TABLE "raw_data"."metadata_indicateurs_hidden"
ADD CONSTRAINT "fk_indicateur_hidden_zonegroup" FOREIGN KEY ("zg_applicable") REFERENCES "raw_data"."metadata_zonegroup" ("zone_group_id");
