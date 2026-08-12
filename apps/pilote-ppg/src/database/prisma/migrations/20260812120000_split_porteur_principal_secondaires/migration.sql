-- Séparation de porteur_ids_noDAC en porteur_id_principal (String?) + porteur_ids_secondaires (String[])
-- Le premier élément de l'ancien tableau devient le porteur principal, le reste devient secondaires.

ALTER TABLE raw_data.metadata_chantiers
  ADD COLUMN "porteur_id_principal"    TEXT,
  ADD COLUMN "porteur_ids_secondaires" TEXT[] NOT NULL DEFAULT '{}';

UPDATE raw_data.metadata_chantiers
SET
  "porteur_id_principal"    = CASE
                                WHEN CARDINALITY("porteur_ids_noDAC") > 0
                                THEN "porteur_ids_noDAC"[1]
                                ELSE NULL
                              END,
  "porteur_ids_secondaires" = CASE
                                WHEN CARDINALITY("porteur_ids_noDAC") > 1
                                THEN "porteur_ids_noDAC"[2:]
                                ELSE '{}'
                              END;

ALTER TABLE raw_data.metadata_chantiers
  DROP COLUMN "porteur_ids_noDAC";
