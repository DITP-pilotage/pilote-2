

select ch_meteo_id, ch_meteo_name from "dev_pilote__6230"."raw_data"."metadata_chantier_meteos" 
WHERE 
    -- un ID non vide
    ch_meteo_id is NULL OR
    -- un ID en majuscules
    ch_meteo_id <> upper(ch_meteo_id) OR
    -- un nom non-vide
    ch_meteo_name is NULL