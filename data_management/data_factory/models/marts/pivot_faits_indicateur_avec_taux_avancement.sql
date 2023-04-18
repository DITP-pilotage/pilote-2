WITH pivot_fait_indicateur_renommage AS (
    SELECT
        *,
        valeur_actuelle AS valeur_actuelle_comparable
    FROM {{ ref('pivot_faits_indicateur')}}
),

pivot_fait_indicateur_avec_avancement AS (
    SELECT
        *,
        (valeur_actuelle_comparable - valeur_initiale) / (valeur_cible - valeur_initiale) * 100 AS avancement_global
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