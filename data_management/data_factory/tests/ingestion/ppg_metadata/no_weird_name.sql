{{ config(
    enabled=true,
    tags="data_ingestion",
    severity = "error",
    store_failures = true,
    limit = 100,
    meta={"is_demo": "true"}
) }}

-- Test de démo qui passe
-- (test de démo, pas utile)


select axe_id from {{ref('metadata_axes')}} where axe_id = 'weird_name'