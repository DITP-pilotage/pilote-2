{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "data_quality_vc", "data_quality"],
    severity = "warn",
    store_failures = false
) }}

-- Ce test remonte les VC globale qui ne sont pas en 2026
SELECT * from {{ ref('last_vc_global') }} WHERE EXTRACT(year FROM date_releve) <> 2026