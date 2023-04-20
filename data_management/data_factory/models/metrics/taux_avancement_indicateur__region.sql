WITH pivot_faits_indicateur_reg_dept as (
    SELECT * from {{ ref("pivot_faits_indicateur") }} WHERE zone_type = 'REG'
),

taux_avancement_region_avec_mesures as (
    SELECT
        indicateur_id,
        zone_id,
        max(zone_id_parent),
        sum(valeur_initiale) total_vi,
        sum(valeur_actuelle) total_va,
        sum(valeur_cible) total_vc,
        CASE
            WHEN sum(valeur_cible) <> sum(valeur_initiale)
                THEN sum(valeur_actuelle - valeur_initiale) / sum(valeur_cible - valeur_initiale) * 100
            ELSE NULL
            END AS avancement_global
    FROM pivot_faits_indicateur_reg_dept
    WHERE departement_code is null
    GROUP BY indicateur_id, zone_id
),

pivot_faits_indicateur_departements_sans_mesure_regionale as (
    SELECT
        taux_avancement_indicateur__departement.indicateur_id,
        taux_avancement_indicateur__departement.zone_id,
        taux_avancement_indicateur__departement.zone_id_parent,
        'FRANCE' as national_code,
        taux_avancement_indicateur__departement.valeur_initiale as valeur_initiale,
        taux_avancement_indicateur__departement.valeur_actuelle as valeur_actuelle,
        taux_avancement_indicateur__departement.valeur_cible as valeur_cible
    FROM {{ ref("taux_avancement_indicateur__departement") }}
    LEFT JOIN taux_avancement_region_avec_mesures as ta_reg_avec_mesures
        ON taux_avancement_indicateur__departement.indicateur_id = ta_reg_avec_mesures.indicateur_id
            AND taux_avancement_indicateur__departement.zone_id_parent = ta_reg_avec_mesures.zone_id
    WHERE ta_reg_avec_mesures.indicateur_id IS NULL
        AND taux_avancement_indicateur__departement.zone_type_parent = 'REG'
),

taux_avancement_region as (
    SELECT
        indicateur_id,
        zone_id_parent as zone_id,
        max(zone_id_parent),
        sum(valeur_initiale) total_vi,
        sum(valeur_actuelle) total_va,
        sum(valeur_cible) total_vc,
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
        WHEN avancement_global IS NOT null
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE null
        END AS avancement_global_borne
from taux_avancement_region