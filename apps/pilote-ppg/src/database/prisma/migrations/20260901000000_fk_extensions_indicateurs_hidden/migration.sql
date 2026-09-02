-- Nettoyage préalable : toute ligne de metadata_indicateurs_complementaire ou
-- metadata_parametrage_indicateurs dont l'indic_id ne correspond à aucune ligne
-- de metadata_indicateurs_hidden (table pilote) est supprimée avant la pose de
-- la contrainte de clé étrangère. Sur les fixtures de test, ces tables sont
-- parfaitement alignées (zéro orphelin) ; cette suppression est un filet de
-- sécurité idempotent, sur le modèle du nettoyage fait dans la migration
-- 20260827000000_fk_zg_applicable_indicateurs.
DELETE FROM "raw_data"."metadata_indicateurs_complementaire" AS complementaire
WHERE NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_indicateurs_hidden" AS hidden
    WHERE hidden."indic_id" = complementaire."indic_id"
  );

DELETE FROM "raw_data"."metadata_parametrage_indicateurs" AS parametrage
WHERE NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_indicateurs_hidden" AS hidden
    WHERE hidden."indic_id" = parametrage."indic_id"
  );

-- Contraintes de clé étrangère : metadata_indicateurs_complementaire et
-- metadata_parametrage_indicateurs référencent metadata_indicateurs_hidden
-- (table pilote qui contient tous les indicateurs, masqués ou non).
-- DEFERRABLE INITIALLY DEFERRED : la contrainte n'est vérifiée qu'au COMMIT,
-- pas à chaque INSERT, pour tolérer un chargement qui insère les trois
-- tables dans le désordre à l'intérieur d'une même transaction (cf.
-- docs/specs/fk-tables-extension-indicateurs.md).
ALTER TABLE "raw_data"."metadata_indicateurs_complementaire"
ADD CONSTRAINT "fk_indicateur_complementaire_hidden" FOREIGN KEY ("indic_id") REFERENCES "raw_data"."metadata_indicateurs_hidden" ("indic_id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "raw_data"."metadata_parametrage_indicateurs"
ADD CONSTRAINT "fk_indicateur_parametrage_hidden" FOREIGN KEY ("indic_id") REFERENCES "raw_data"."metadata_indicateurs_hidden" ("indic_id") DEFERRABLE INITIALLY DEFERRED;
