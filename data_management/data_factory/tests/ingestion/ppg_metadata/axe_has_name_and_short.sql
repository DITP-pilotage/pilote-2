{{ config(
    enabled=true,
    tags="data_ingestion",
    severity = "error",
    store_failures = true,
    limit = 100,
    meta={"is_demo": "false"}
) }}

-- Chaque axe a bien un ID et un nom non vide
select axe_id, axe_name from {{ref('metadata_axes')}} 
WHERE 
    axe_id is NULL OR
    axe_name is NULL
