{{ config(
    enabled=true,
    tags="data_ingestion",
    severity = "error",
    store_failures = true,
    limit = 100,
    meta={"is_demo": "false"}
) }}

select ch_meteo_id, ch_meteo_name from {{ref('metadata_chantier_meteos')}} 
WHERE 
    -- un ID non vide
    ch_meteo_id is NULL OR
    -- un ID en majuscules
    ch_meteo_id <> upper(ch_meteo_id) OR
    -- un nom non-vide
    ch_meteo_name is NULL
