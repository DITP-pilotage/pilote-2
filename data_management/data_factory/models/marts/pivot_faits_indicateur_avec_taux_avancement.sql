WITH pivot_fait_indicateur_renommage as (

    Select
        *,
        valeur_actuelle as valeur_actuelle_comparable
    FROM {{ ref('pivot_faits_indicateur')}}

)

SELECT
    *,
    (valeur_actuelle_comparable - valeur_initiale) / (valeur_cible - valeur_initiale) * 100 as avancement_global
from pivot_fait_indicateur_renommage
