WITH pivot_fait_indicateur_renommage as (

    Select
        *,
        valeur_actuelle as valeur_actuelle_comparable
    FROM {{ ref('pivot_faits_indicateur')}}

)

SELECT
    *,
    (valeur_actuelle_comparable - valeur_initiale) / (valeur_cible - valeur_initiale) * 100 as avancement_global,
    GREATEST(LEAST((valeur_actuelle - valeur_initiale) / (valeur_cible - valeur_initiale) * 100, 100), 0) as avancement_global_borne
from pivot_fait_indicateur_renommage
