-- Le porteur principal est désormais obligatoire dans le formulaire d'édition
-- des chantiers. Tous les chantiers existants ont déjà un porteur_id_principal
-- renseigné : on aligne la contrainte en base.
ALTER TABLE "raw_data"."metadata_chantiers"
  ALTER COLUMN "porteur_id_principal" SET NOT NULL;
