SELECT
    1
FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_comparable')}}
