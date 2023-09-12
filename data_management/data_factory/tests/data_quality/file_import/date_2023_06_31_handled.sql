{{ config(
    enabled=true,
    tags=["data_quality", "scope_chantier"],
    severity = "error",
    error_if = ">495",
    warn_if = ">495",
    store_failures = false
) }}

-- On vérifie que l'on a seulement 495 lignes avec comme date de valeur importée au 2023-06-31
--      Cette date est invalide mais traitée. Cela ne devrait pas se reproduire grace aux contraintes
--      mises lors de l'import de données.
SELECT * FROM {{ source('import_from_files', 'mesure_indicateur') }} WHERE metric_date::text = '2023-06-31'
