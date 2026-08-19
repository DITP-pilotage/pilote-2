-- Conversion TEXT → TEXT[] pour porteur_ids_noDAC, porteur_ids_DAC, maille_applicable
ALTER TABLE raw_data.metadata_chantiers
ALTER COLUMN "porteur_ids_noDAC" TYPE TEXT [] USING CASE
    WHEN "porteur_ids_noDAC" IS NULL THEN ARRAY[]::TEXT []
    ELSE STRING_TO_ARRAY("porteur_ids_noDAC", ' | ')
END,
ALTER COLUMN "porteur_ids_DAC" TYPE TEXT [] USING CASE
    WHEN "porteur_ids_DAC" IS NULL THEN ARRAY[]::TEXT []
    ELSE STRING_TO_ARRAY("porteur_ids_DAC", ' | ')
END,
ALTER COLUMN "maille_applicable" TYPE TEXT [] USING CASE
    WHEN maille_applicable IS NULL
    AND ch_territo = false THEN ARRAY['NAT']::TEXT []
    WHEN maille_applicable IS NULL
    AND ch_territo = true THEN ARRAY['NAT', 'REG', 'DEPT']::TEXT []
    ELSE STRING_TO_ARRAY(maille_applicable, ' | ')
END;

-- Normaliser les tableaux vides de maille_applicable selon ch_territo
UPDATE raw_data.metadata_chantiers
SET
    maille_applicable = CASE
        WHEN ch_territo = true THEN ARRAY['NAT', 'REG', 'DEPT']
        ELSE ARRAY['NAT']
    END
WHERE
    array_length(maille_applicable, 1) IS NULL;

-- Contrainte NOT NULL sur maille_applicable (toutes les lignes sont normalisées)
ALTER TABLE raw_data.metadata_chantiers
ALTER COLUMN maille_applicable
SET NOT NULL;

-- zg_name est toujours renseigné dans les données de référence
ALTER TABLE raw_data.metadata_zonegroup
ALTER COLUMN "zg_name"
SET NOT NULL;

-- Clés étrangères déclaratives
ALTER TABLE raw_data.metadata_chantiers
ADD CONSTRAINT fk_chantier_ppg FOREIGN KEY (ch_ppg) REFERENCES raw_data.metadata_ppgs (ppg_id),
ADD CONSTRAINT fk_chantier_perimetre FOREIGN KEY (ch_per) REFERENCES raw_data.metadata_perimetres (perimetre_id),
ADD CONSTRAINT fk_chantier_zonegroup FOREIGN KEY (zg_applicable) REFERENCES raw_data.metadata_zonegroup (zone_group_id);