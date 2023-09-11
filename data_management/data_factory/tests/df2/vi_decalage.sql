{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_decalage"],
    severity = "warn",
    store_failures = false
) }}

-- Ce test consiste à vérifier si les VI déterminées par la df2
--  sont identiques aux VI que l'on a actuellement

SELECT * FROM {{ ref('df2_int_dfakto_indicateurs_metrics') }} 
WHERE valeur_initiale <> valeur_initiale_colin