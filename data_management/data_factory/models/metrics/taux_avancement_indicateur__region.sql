WITH pivot_faits_indicateur_reg_dept AS (
    SELECT * from {{ ref("pivot_faits_indicateur") }} WHERE zone_type = 'REG'
),

taux_avancement_region_avec_mesures AS (
    SELECT
        indicateur_id,
        zone_id,
        zone_id_parent,
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
    FROM pivot_faits_indicateur_reg_dept
    WHERE departement_code is null -- TODO condition vraiment nécessaire ? car avant zone_type = 'REG' a vérifier si on peut enlever quand on aura plus de données
),

pivot_faits_indicateur_departements_sans_mesure_regionale AS (
    SELECT
        taux_avancement_indicateur__departement.indicateur_id,
        taux_avancement_indicateur__departement.zone_id,
        taux_avancement_indicateur__departement.zone_id_parent,
        'FRANCE' AS national_code,
        taux_avancement_indicateur__departement.valeur_initiale AS valeur_initiale,
        taux_avancement_indicateur__departement.valeur_actuelle AS valeur_actuelle,
        taux_avancement_indicateur__departement.valeur_cible AS valeur_cible
    FROM {{ ref("taux_avancement_indicateur__departement") }}
    LEFT JOIN taux_avancement_region_avec_mesures AS ta_reg_avec_mesures
        ON taux_avancement_indicateur__departement.indicateur_id = ta_reg_avec_mesures.indicateur_id
            AND taux_avancement_indicateur__departement.zone_id_parent = ta_reg_avec_mesures.zone_id
    WHERE ta_reg_avec_mesures.indicateur_id IS NULL
        AND taux_avancement_indicateur__departement.zone_type_parent = 'REG'
),

taux_avancement_region AS (
    SELECT
        indicateur_id,
        zone_id_parent AS zone_id,
        max(national_code) AS zone_id_parent,
        sum(valeur_initiale) AS valeur_initiale,
        sum(valeur_actuelle) AS valeur_actuelle,
        sum(valeur_cible) AS valeur_cible,
        NULL AS date_valeur_initiale,
        NULL AS date_valeur_actuelle,
        NULL AS date_valeur_cible,
        CASE
            WHEN sum(valeur_cible) <> sum(valeur_initiale)
                THEN sum(valeur_actuelle - valeur_initiale) / sum(valeur_cible - valeur_initiale) * 100
            ELSE NULL
            END AS avancement_global
    FROM pivot_faits_indicateur_departements_sans_mesure_regionale
    GROUP BY indicateur_id, zone_id_parent
    UNION
    SELECT * FROM taux_avancement_region_avec_mesures
)

SELECT
    *,
    CASE
        WHEN avancement_global IS NOT NULL
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE NULL
        END AS avancement_global_borne
from taux_avancement_region