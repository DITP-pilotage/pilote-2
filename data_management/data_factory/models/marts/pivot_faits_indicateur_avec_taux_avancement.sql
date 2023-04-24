WITH pivot_fait_indicateur_renommage AS (
    SELECT
        *,
        valeur_actuelle AS valeur_actuelle_comparable
    FROM {{ ref('pivot_faits_indicateur')}}
),

pivot_fait_indicateur_avec_avancement AS (
    SELECT
        *,
        CASE
            WHEN valeur_cible <> valeur_initiale
                THEN (valeur_actuelle_comparable - valeur_initiale) / (valeur_cible - valeur_initiale) * 100
            ELSE NULL
            END AS avancement_global
    FROM pivot_fait_indicateur_renommage
)

SELECT
    *,
    CASE
        WHEN avancement_global IS NOT null
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE null
        END AS avancement_global_borne
from pivot_fait_indicateur_avec_avancement