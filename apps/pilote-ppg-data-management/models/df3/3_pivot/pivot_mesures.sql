WITH
-- Pivot des vi
pivot_vi AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_value AS vi
    FROM {{ ref('agg_all_replicate') }}
    WHERE metric_type = 'vi'
),

-- Pivot des va
pivot_va AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_value AS va
    FROM {{ ref('agg_all_replicate') }}
    WHERE metric_type = 'va'
),

-- Pivot des vc
pivot_vc AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_value AS vc
    FROM {{ ref('agg_all_replicate') }}
    WHERE metric_type = 'vc'
),

-- Jointure des 2 tables pivotées: vi X va => u_vi_va
--  pour construire les colonnes vi et va
u_vi_va AS (
    SELECT
        -- on garde la vi de table a, la va de la table b
        pivot_vi.vi,
        pivot_va.va,
        COALESCE(pivot_vi.id, pivot_va.id) AS id,
        COALESCE(pivot_vi.date_import, pivot_va.date_import) AS date_import,
        COALESCE(pivot_vi.indic_id, pivot_va.indic_id) AS indic_id,
        COALESCE(pivot_vi.zone_id, pivot_va.zone_id) AS zone_id,
        COALESCE(pivot_vi.metric_date, pivot_va.metric_date) AS metric_date
    FROM pivot_vi
    FULL JOIN
        pivot_va
        ON
            pivot_vi.indic_id = pivot_va.indic_id
            AND pivot_vi.zone_id = pivot_va.zone_id
            AND pivot_vi.metric_date = pivot_va.metric_date
),

-- Jointure des 2 tables pivotées: u_vi_va X vc => u_vi_va_vc
--  pour ajouter la colonne vc
u_vi_va_vc AS (
    SELECT
        COALESCE(u_vi_va.id, pivot_vc.id) AS id,
        COALESCE(u_vi_va.date_import, pivot_vc.date_import) AS date_import,
        -- on garde la vi et va de la table a, la vc de la table c
        u_vi_va.vi,
        u_vi_va.va,
        pivot_vc.vc,
        COALESCE(u_vi_va.indic_id, pivot_vc.indic_id) AS indic_id,
        COALESCE(u_vi_va.zone_id, pivot_vc.zone_id) AS zone_id,
        COALESCE(u_vi_va.metric_date, pivot_vc.metric_date) AS metric_date
    FROM u_vi_va
    FULL JOIN pivot_vc
        ON
            u_vi_va.indic_id = pivot_vc.indic_id
            AND u_vi_va.zone_id = pivot_vc.zone_id
            AND u_vi_va.metric_date = pivot_vc.metric_date
--ORDER BY indic_id ASC, zone_id ASC, metric_date ASC
)

SELECT * FROM u_vi_va_vc
