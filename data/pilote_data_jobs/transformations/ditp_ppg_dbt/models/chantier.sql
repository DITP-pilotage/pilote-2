SELECT
    chantier_id as id,
    ch_nom as nom,
    (string_to_array(ch_per, ' | '))[1] as id_perimetre
FROM raw_data.metadata_chantier
