WITH valeurs_cibles_annuelles AS (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, date_trunc('year', date_releve) ORDER BY date_releve DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_trunc('year', date_releve) AS annee_releve,
        valeur_cible AS valeur
    FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}}
    WHERE valeur_cible is not NULL
)

SELECT
    pivot.indicateur_id,
    pivot.zone_id,
    pivot.date_releve,
    COALESCE(pivot.valeur_initiale, (
        SELECT pivot_pour_derniere_valeur_intitiale_non_nulle.valeur_initiale
        FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot_pour_derniere_valeur_intitiale_non_nulle
        WHERE pivot_pour_derniere_valeur_intitiale_non_nulle.indicateur_id = pivot.indicateur_id
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.zone_id = pivot.zone_id
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.valeur_initiale IS NOT NULL
            AND pivot_pour_derniere_valeur_intitiale_non_nulle.date_releve < pivot.date_releve
        ORDER BY pivot_pour_derniere_valeur_intitiale_non_nulle.date_releve DESC
        LIMIT 1
    )) AS valeur_initiale,
    pivot.valeur_actuelle,
    COALESCE(valeur_cible,
        (
            SELECT valeur_cible
            FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}}  pivot_pour_premiere_valeur_cible_non_nulle
            WHERE pivot_pour_premiere_valeur_cible_non_nulle.indicateur_id = pivot.indicateur_id
                AND pivot_pour_premiere_valeur_cible_non_nulle.zone_id = pivot.zone_id
                AND pivot_pour_premiere_valeur_cible_non_nulle.date_releve > pivot.date_releve
                AND pivot_pour_premiere_valeur_cible_non_nulle.valeur_cible IS NOT NULL
            ORDER BY pivot_pour_premiere_valeur_cible_non_nulle.date_releve
            LIMIT 1
        )
    ) as valeur_cible_annuelle,
    (
        SELECT pivot_pour_derniere_valeur_cible_non_nulle.valeur_cible
        FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot_pour_derniere_valeur_cible_non_nulle
        WHERE pivot_pour_derniere_valeur_cible_non_nulle.indicateur_id = pivot.indicateur_id
            AND pivot_pour_derniere_valeur_cible_non_nulle.zone_id = pivot.zone_id
            AND pivot_pour_derniere_valeur_cible_non_nulle.valeur_cible IS NOT NULL
        ORDER BY pivot_pour_derniere_valeur_cible_non_nulle.date_releve DESC
        LIMIT 1
    ) AS valeur_cible_globale
FROM {{ ref('pivot_faits_indicateur_toutes_mailles')}} pivot
ORDER BY pivot.indicateur_id, pivot.zone_id, pivot.date_releve
