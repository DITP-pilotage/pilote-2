WITH pivot_fait_indicateur_avec_avancement AS (
    SELECT
        indicateur_id,
        zone_id,
        zone_id_parent,
        zone_type_parent,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        date_valeur_initiale,
        date_valeur_actuelle,
        date_valeur_cible,
        CASE
            WHEN valeur_cible <> valeur_initiale
                THEN (valeur_actuelle - valeur_initiale) / (valeur_cible - valeur_initiale) * 100
            ELSE NULL
            END AS avancement_global
    FROM {{ ref('pivot_faits_indicateur')}}
    WHERE zone_type = 'DEPT'
)

SELECT
    *,
    CASE
        WHEN avancement_global IS NOT null
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE null
        END AS avancement_global_borne
from pivot_fait_indicateur_avec_avancement