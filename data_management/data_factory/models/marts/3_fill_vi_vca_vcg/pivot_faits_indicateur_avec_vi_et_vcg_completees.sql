SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    COALESCE(pivot.indicateur_valeur_initiale, (
        SELECT pivot_pour_derniere_valeur_intitiale_non_nulle.indicateur_valeur_initiale
        FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot_pour_derniere_valeur_intitiale_non_nulle
        WHERE pivot_pour_derniere_valeur_intitiale_non_nulle.indicateur_id = pivot.indicateur_id
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.zone_id = pivot.zone_id
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.indicateur_valeur_initiale IS NOT NULL
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.date_releve < pivot.date_releve
        ORDER BY pivot_pour_derniere_valeur_intitiale_non_nulle.date_releve DESC
        LIMIT 1
    )) AS indicateur_valeur_initiale,
    pivot.indicateur_valeur_actuelle,
    (
        SELECT pivot_pour_derniere_valeur_cible_non_nulle.indicateur_valeur_cible
        FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot_pour_derniere_valeur_cible_non_nulle
        WHERE pivot_pour_derniere_valeur_cible_non_nulle.indicateur_id = pivot.indicateur_id
            AND pivot_pour_derniere_valeur_cible_non_nulle.zone_id = pivot.zone_id
            AND pivot_pour_derniere_valeur_cible_non_nulle.indicateur_valeur_cible IS NOT NULL
        ORDER BY pivot_pour_derniere_valeur_cible_non_nulle.date_releve DESC
        LIMIT 1
    ) AS indicateur_valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot
ORDER BY pivot.indicateur_id, pivot.zone_id, pivot.date_releve
