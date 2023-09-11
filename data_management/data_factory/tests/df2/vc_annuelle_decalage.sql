{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_decalage"],
    severity = "warn",
    store_failures = false
) }}

-- Ce test consiste à vérifier si les VC annuelles déterminées par la df2
--  sont identiques aux VC  annuelles que l'on a actuellement

SELECT * FROM {{ ref('df2_int_dfakto_indicateurs_metrics') }} 
WHERE objectif_valeur_cible_intermediaire <> objectif_valeur_cible_intermediaire_colin