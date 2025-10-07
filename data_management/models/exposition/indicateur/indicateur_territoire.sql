-- depends_on: {{ ref('chantier_territoire') }}
-- depends_on: {{ ref('indicateur_identite') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id', 'territoire_code'],
        incremental_strategy='merge'
    )
}}

-- Reformattage (pour chaque indicateur-zone):
--	- Retourne au format [{date: "YYYY-MM-DD", valeur: 12.34}]
WITH
get_evol_vaca AS (
    SELECT
        indic_id,
        zone_id,
        jsonb_agg(jsonb_build_object(
            'date', metric_date,
            'valeur', vaca
        )) AS evolution_valeur_actuelle
    FROM {{ ref('compute_ta_indic') }}
    WHERE vaca IS NOT null
    GROUP BY indic_id, zone_id
)


SELECT
    meta_indic.id,
    meta_indic.chantier_id,
    territoire.maille,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.zone_id,
    gvcg.vcg AS valeur_cible_mandat,
    a.tag AS taux_avancement_mandat,
    a.date_valeur_actuelle::date AS date_valeur_actuelle_mandat,
    gvig.vig_date::date AS date_valeur_initiale,
    a.vaca AS valeur_actuelle_mandat,
    gvig.vig AS valeur_initiale,
    territoire.nom AS territoire_nom,
    gvcg.vcg_date::date AS date_valeur_cible_mandat,
    coalesce(z_appl.est_applicable, true) AND maille_appl.maille_est_applicable AS est_applicable,
    pond_reelle.poids_zone_declaree AS ponderation_zone_declaree,
    pond_reelle.poids_zone_reel AS ponderation_zone_reel,
    CASE
        WHEN coalesce(z_appl.est_applicable, true) AND maille_appl.maille_est_applicable THEN date_pro_maj.est_a_jour
    END AS est_a_jour,
    -- Si l'indic n'est pas applicable sur la zone, prochaine_date_maj=NULL
    --	peu importe la date calculée pour la maille correspondant à cette zone
    CASE
        WHEN
            coalesce(z_appl.est_applicable, true) AND maille_appl.maille_est_applicable
            THEN date_pro_maj.prochaine_date_maj
    END AS prochaine_date_maj,
    CASE
        WHEN
            coalesce(z_appl.est_applicable, true) AND maille_appl.maille_est_applicable
            THEN date_pro_maj.prochaine_date_maj_jours
    END AS prochaine_date_maj_jours,
    meta_indic_parametrage.tendance,
    a.tap_global AS taux_avancement_mandat_proposition_v2,
    CASE
        WHEN
            coalesce(z_appl.est_applicable, true) AND maille_appl.maille_est_applicable
            THEN date_pro_maj.prochaine_date_va
    END AS prochaine_date_valeur_actuelle,
    coalesce(
        evol_va.evolution_valeur_actuelle,
        '[]'::jsonb	-- Return [] if the join gives NULL
    ) AS evolution_valeur_actuelle

FROM {{ source('db_schema_public', 'territoire') }} AS territoire
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS meta_zone
    ON territoire.zone_id = meta_zone.id
LEFT JOIN {{ ref('get_vcg') }} AS gvcg
    ON meta_indic.id = gvcg.indic_id AND territoire.zone_id = gvcg.zone_id
LEFT JOIN {{ ref('get_last_vaca') }} AS a
    ON meta_indic.id = a.indic_id AND territoire.zone_id = a.zone_id
LEFT JOIN {{ ref('get_vig') }} AS gvig
    ON meta_indic.id = gvig.indic_id AND territoire.zone_id = gvig.zone_id
LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} AS z_appl
    ON meta_indic.id = z_appl.indic_id AND territoire.zone_id = z_appl.zone_id
LEFT JOIN {{ ref( 'int_indicateurs_mailles_applicables') }} as maille_appl
    ON meta_indic.id = maille_appl.id AND territoire.maille = LOWER(maille_appl.maille)::maille
LEFT JOIN {{ ref('int_ponderation_reelle') }} AS pond_reelle
    ON
        meta_indic.id = pond_reelle.indic_id
        AND territoire.zone_id = pond_reelle.zone_id
LEFT JOIN {{ ref('get_date_pro_maj_indic') }} AS date_pro_maj
    ON
        meta_indic.id = date_pro_maj.indic_id
        AND meta_zone.maille = date_pro_maj.maille
-- TODO: create stg table for this
LEFT JOIN
    {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS meta_indic_parametrage
    ON meta_indic.id = meta_indic_parametrage.indic_id
LEFT JOIN get_evol_vaca AS evol_va
    ON meta_indic.id = evol_va.indic_id AND territoire.zone_id = evol_va.zone_id
ORDER BY meta_indic.id, territoire.maille, territoire.code