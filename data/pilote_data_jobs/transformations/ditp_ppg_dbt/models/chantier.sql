SELECT
    chantier_id as id,
    ch_nom as nom,
    string_to_array(ch_per, ' | ') as perimetre_ids
FROM raw_data.metadata_chantier



