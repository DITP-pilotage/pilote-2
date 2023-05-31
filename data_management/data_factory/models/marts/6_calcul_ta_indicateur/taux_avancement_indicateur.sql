WITH taux_avancement_indicateur as (
    SELECT
        *,
        CASE
            WHEN valeur_cible_annuelle <> valeur_initiale
                THEN (valeur_actuelle_comparable_annuelle - valeur_initiale) / (valeur_cible_annuelle - valeur_initiale) * 100
            ELSE NULL
        END AS taux_avancement_annuel,
        CASE
            WHEN valeur_cible_globale <> valeur_initiale
                THEN (valeur_actuelle_comparable_globale - valeur_initiale) / (valeur_cible_globale - valeur_initiale) * 100
            ELSE NULL
        END AS taux_avancement_globale
    FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_comparable')}}
)

SELECT
    *,
    CASE
        WHEN taux_avancement_annuel IS NOT NULL
            THEN GREATEST(LEAST(taux_avancement_annuel, 100), 0)
        ELSE NULL
    END AS taux_avancement_annuel_borne,
    CASE
        WHEN taux_avancement_globale IS NOT NULL
            THEN GREATEST(LEAST(taux_avancement_globale, 100), 0)
        ELSE NULL
    END AS taux_avancement_globale_borne
FROM taux_avancement_indicateur