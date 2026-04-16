WITH
-- Liste des indicateurs du baromètre
indic_baro AS (
    SELECT id
    FROM {{ ref('stg_ppg_metadata__indicateurs') }}
    WHERE est_barometre
),

-- Données des indicateurs du baromètre
donnees AS (
    SELECT
        indicateur_territoire.*,
        zones.maille AS zone_type
    -- On ne garde que les indicateurs au baromètres
    FROM indic_baro
    LEFT OUTER JOIN {{ ref('indicateur_territoire') }} AS indicateur_territoire
        ON indic_baro.id = indicateur_territoire.id
    -- pour: Ajout de la zone_type (maille)
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS zones
        ON indicateur_territoire.zone_id = zones.id
),

-- Données VA
export_va AS (
    SELECT
        donnees.id AS indic_id,
        donnees.zone_id AS enforce_zone_id,
        donnees.zone_type AS maille,
        -- Unnest des valeurs des VA
        va_indic.va_date_unnest_computed AS metric_enforce_date,
        -- Unnest des dates des VA
        va_indic.va_unnest_computed AS indic_va
    FROM donnees
    LEFT JOIN
        {{ ref('df3_indicateur_unnest_va') }} AS va_indic
        ON
            donnees.id = va_indic.id
            AND donnees.territoire_code = va_indic.territoire_code
    -- On ne garde que les lignes où une VA est dispo
    WHERE donnees.evolution_avancement IS NOT NULL
),

-- Données VI
export_vi AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_initiale AS metric_enforce_date,
        -- VI
        valeur_initiale AS indic_vi
    FROM donnees
    -- On ne garde que les lignes où une VI est dispo
    WHERE valeur_initiale IS NOT NULL
),

-- Données VC
export_vc AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_cible_mandat AS metric_enforce_date,
        -- VC
        valeur_cible_mandat AS indic_vc
    FROM donnees
    -- On ne garde que les lignes où une VC est dispo
    WHERE valeur_cible_mandat IS NOT NULL
),

-- Données TA
export_ta AS (
    SELECT
        id AS indic_id,
        zone_id AS enforce_zone_id,
        zone_type AS maille,
        date_valeur_actuelle_mandat AS metric_enforce_date,
        -- TA
        taux_avancement_mandat AS indic_ta
    FROM donnees
    -- On ne garde que les lignes où un TA est dispo
    WHERE taux_avancement_mandat IS NOT NULL
),

-- Combinaison des VI,VA,VC,TA
merge_exports AS (
    SELECT
        COALESCE(
            export_va.indic_id,
            export_vi.indic_id,
            export_vc.indic_id,
            export_ta.indic_id
        ) AS indic_id,
        COALESCE(
            export_va.enforce_zone_id,
            export_vi.enforce_zone_id,
            export_vc.enforce_zone_id,
            export_ta.enforce_zone_id
        ) AS enforce_zone_id,
        COALESCE(
            export_va.metric_enforce_date,
            export_vi.metric_enforce_date,
            export_vc.metric_enforce_date,
            export_ta.metric_enforce_date
        ) AS metric_enforce_date,
        COALESCE(
            export_va.maille,
            export_vi.maille,
            export_vc.maille,
            export_ta.maille
        ) AS maille,
        export_vi.indic_vi,
        export_va.indic_va,
        export_vc.indic_vc,
        export_ta.indic_ta
    FROM
        export_va
    FULL JOIN
        export_vi
        ON
            export_va.indic_id = export_vi.indic_id
            AND export_va.enforce_zone_id = export_vi.enforce_zone_id
            AND export_va.metric_enforce_date = export_vi.metric_enforce_date
    FULL JOIN
        export_vc
        ON
            export_va.indic_id = export_vc.indic_id
            AND export_va.enforce_zone_id = export_vc.enforce_zone_id
            AND export_va.metric_enforce_date = export_vc.metric_enforce_date
    FULL JOIN
        export_ta
        ON
            export_va.indic_id = export_ta.indic_id
            AND export_va.enforce_zone_id = export_ta.enforce_zone_id
            AND export_va.metric_enforce_date = export_ta.metric_enforce_date
)

-- On arrondit les VI,VA,VC,TA à deux décimales

SELECT
    indic_id,
    enforce_zone_id,
    metric_enforce_date,
    maille,
    ROUND(indic_vi::NUMERIC, 2) AS indic_vi,
    ROUND(indic_va::NUMERIC, 2) AS indic_va,
    ROUND(indic_vc::NUMERIC, 2) AS indic_vc,
    ROUND(indic_ta::NUMERIC, 2) AS indic_ta
FROM merge_exports
