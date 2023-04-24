WITH pivot_faits_indicateur_reg_dept as (
    SELECT * from {{ ref("pivot_faits_indicateur") }} WHERE zone_type = 'NAT'
),

taux_avancement_national_avec_mesures as (
    SELECT
        indicateur_id,
        zone_id,
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
),

pivot_faits_indicateur_regions_sans_mesure_nationale as (
    SELECT
        taux_avancement_indicateur__region.indicateur_id,
        taux_avancement_indicateur__region.zone_id,
        taux_avancement_indicateur__region.zone_id_parent,
        taux_avancement_indicateur__region.valeur_initiale as valeur_initiale,
        taux_avancement_indicateur__region.valeur_actuelle as valeur_actuelle,
        taux_avancement_indicateur__region.valeur_cible as valeur_cible
    FROM {{ ref("taux_avancement_indicateur__region") }}
    LEFT JOIN taux_avancement_national_avec_mesures as ta_nat_avec_mesures
        ON taux_avancement_indicateur__region.indicateur_id = ta_nat_avec_mesures.indicateur_id
            AND taux_avancement_indicateur__region.zone_id_parent = ta_nat_avec_mesures.zone_id
    WHERE ta_nat_avec_mesures.indicateur_id IS NULL
),

taux_avancement_national AS (
    SELECT
        indicateur_id,
        zone_id_parent AS zone_id,
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
    FROM pivot_faits_indicateur_regions_sans_mesure_nationale
    GROUP BY indicateur_id, zone_id_parent
    UNION
    SELECT * FROM taux_avancement_national_avec_mesures
)

SELECT
    *,
    CASE
        WHEN avancement_global IS NOT NULL
            THEN GREATEST(LEAST(avancement_global, 100), 0)
        ELSE NULL
        END AS avancement_global_borne
from taux_avancement_national
