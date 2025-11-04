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
    FROM {{ ref('agg_all_replicate') }} WHERE metric_type = 'vi'
),

-- Pivot des va
pivot_va AS (
    SELECT
        id, 
        date_import, 
        indic_id,
        is_last_monthly_value,
        zone_id,
        metric_date,
        metric_value AS va
    FROM {{ ref('agg_all_replicate') }} WHERE metric_type = 'va'
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
    FROM {{ ref('agg_all_replicate') }} WHERE metric_type = 'vc'
),

-- Jointure des 2 tables pivotées: vi X va => u_vi_va
--  pour construire les colonnes vi et va
u_vi_va AS (
    SELECT
        -- on garde la vi de table a, la va et l'info si c'est la dernière va du mois de table b
        a.vi,
        b.va,
        b.is_last_monthly_value as is_last_monthly_value,
        coalesce(a.id, b.id) as id,
        coalesce(a.date_import, b.date_import) as date_import,
        coalesce(a.indic_id, b.indic_id) AS indic_id,
        coalesce(a.zone_id, b.zone_id) AS zone_id,
        coalesce(a.metric_date, b.metric_date) AS metric_date
    FROM pivot_vi AS a
    FULL JOIN
        pivot_va AS b
        ON
            a.indic_id = b.indic_id
            AND a.zone_id = b.zone_id
            AND a.metric_date = b.metric_date
    --ORDER BY indic_id ASC, zone_id ASC, metric_date ASC
),

-- Jointure des 2 tables pivotées: u_vi_va X vc => u_vi_va_vc
--  pour ajouter la colonne vc
u_vi_va_vc AS (
    SELECT
        coalesce(a.id, c.id) as id,
        coalesce(a.date_import, c.date_import) as date_import,
        -- on garde la vi et va et l'info si c'est la dernière va de de table a, la vc de table c
        a.vi,
        a.va,
        c.vc,
        coalesce(a.indic_id, c.indic_id) AS indic_id,
        a.is_last_monthly_value as is_last_monthly_va,
        coalesce(a.zone_id, c.zone_id) AS zone_id,
        coalesce(a.metric_date, c.metric_date) AS metric_date
    FROM u_vi_va AS a
    FULL JOIN
        pivot_vc AS c
        ON
            a.indic_id = c.indic_id
            AND a.zone_id = c.zone_id
            AND a.metric_date = c.metric_date
    --ORDER BY indic_id ASC, zone_id ASC, metric_date ASC
)

SELECT * FROM u_vi_va_vc
