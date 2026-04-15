WITH

indicateurs_zone_applicables AS (
    SELECT DISTINCT
        id AS indic_id,
        chantier_id,
        child_zone_id AS zone_id,
        TRUE AS est_applicable
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS mi
    LEFT JOIN
        {{ ref('stg_ppg_metadata__zonegroup_unnest') }} AS zu
        ON mi.zone_groupe_applicable = zu.zone_group_id
    WHERE zone_groupe_applicable IS NOT NULL
),

indicateurs_za_toutes_zone AS (
    SELECT DISTINCT
        indic_id,
        chantier_id,
        spmz.id AS zone_id
    FROM indicateurs_zone_applicables
    CROSS JOIN {{ ref('stg_ppg_metadata__zones') }} AS spmz
)

SELECT
    indicateurs_za_toutes_zone.indic_id,
    indicateurs_za_toutes_zone.chantier_id,
    indicateurs_za_toutes_zone.zone_id,
    COALESCE(indicateurs_zone_applicables.est_applicable, FALSE)
        AS est_applicable
FROM indicateurs_za_toutes_zone
LEFT JOIN indicateurs_zone_applicables
    ON
        indicateurs_za_toutes_zone.indic_id
        = indicateurs_zone_applicables.indic_id
        AND indicateurs_za_toutes_zone.zone_id
        = indicateurs_zone_applicables.zone_id
