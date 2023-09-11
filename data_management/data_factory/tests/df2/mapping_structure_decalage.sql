{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_decalage"],
    severity = "error",
    store_failures = false
) }}

-- Ce test consiste à vérifier que chaque ligne a bien un nom de structure
SELECT * FROM {{ ref('df2_int_dfakto_indicateurs_metrics') }} 
WHERE nom_structure NOT IN ('Département', 'Région', 'Chantier')