WITH 
-- Pivot des vi
pivot_vi as (
    select id, date_import, indic_id, zone_id, metric_date,
    metric_value as vi
    from {{ ref('agg_all') }} where metric_type ='vi'
),
-- Pivot des va
pivot_va as (
    select id, date_import, indic_id, zone_id, metric_date,
    metric_value as va
    from {{ ref('agg_all') }} where metric_type ='va'
),
-- Pivot des vc
pivot_vc as (
    select id, date_import, indic_id, zone_id, metric_date,
    metric_value as vc
    from {{ ref('agg_all') }} where metric_type ='vc'
),

-- Jointure des 2 tables pivotées: vi X va => u_vi_va
--  pour construire les colonnes vi et va
u_vi_va as (select 
    coalesce(a.id, b.id) as id,
    coalesce(a.date_import, b.date_import) as date_import,
    coalesce(a.indic_id, b.indic_id) as indic_id,
    coalesce(a.zone_id, b.zone_id) as zone_id,
    coalesce(a.metric_date, b.metric_date) as metric_date,
    -- on garde la vi de table a, la va de table b
    a.vi, b.va
from pivot_vi a
    full join pivot_va b on a.indic_id=b.indic_id and a.zone_id=b.zone_id and a.metric_date=b.metric_date
ORDER BY indic_id, zone_id, metric_date asc
), 
-- Jointure des 2 tables pivotées: u_vi_va X vc => u_vi_va_vc
--  pour ajouter la colonne vc
u_vi_va_vc as (select 
    coalesce(a.id, c.id) as id,
    coalesce(a.date_import, c.date_import) as date_import,
    coalesce(a.indic_id, c.indic_id) as indic_id,
    coalesce(a.zone_id, c.zone_id) as zone_id,
    coalesce(a.metric_date, c.metric_date) as metric_date,
    -- on garde la vi et va de table a, la vc de table c
    a.vi, a.va, c.vc
from u_vi_va a
    full join pivot_vc c on a.indic_id=c.indic_id and a.zone_id=c.zone_id and a.metric_date=c.metric_date
ORDER BY indic_id, zone_id, metric_date asc
)

select * from u_vi_va_vc
