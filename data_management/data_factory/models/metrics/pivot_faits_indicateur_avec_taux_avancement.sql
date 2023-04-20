WITH pivot_fait_indicateur_avec_avancement AS (
    SELECT
        *,
        CASE
            WHEN valeur_cible <> valeur_initiale
                THEN (valeur_actuelle - valeur_initiale) / (valeur_cible - valeur_initiale) * 100
            ELSE NULL
            END AS avancement_global
    FROM {{ ref('pivot_faits_indicateur')}}
)

SELECT
    *,
    CASE
        WHEN avancement_global IS NOT null
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE null
        END AS avancement_global_borne
from pivot_fait_indicateur_avec_avancement