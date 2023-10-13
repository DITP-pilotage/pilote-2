WITH 
-- Pivot des vi
pivot_vi as (
    select indic_id, zone_id, metric_date,
    metric_value as vi
    from {{ ref('agg_all') }} where metric_type ='vi'
),
-- Pivot des va
pivot_va as (
    select indic_id, zone_id, metric_date,
    metric_value as va
    from {{ ref('agg_all') }} where metric_type ='va'
),
-- Pivot des vc
pivot_vc as (
    select indic_id, zone_id, metric_date,
    metric_value as vc
    from {{ ref('agg_all') }} where metric_type ='vc'
)

-- Union des 3 tables pivotées
select 
    coalesce(a.indic_id, b.indic_id, c.indic_id) as indic_id,
    coalesce(a.zone_id, b.zone_id, c.zone_id) as zone_id,
    coalesce(a.metric_date, b.metric_date, c.metric_date) as metric_date,
    a.vi, b.va, c.vc
from pivot_vi a
    full join pivot_va b on a.indic_id=b.indic_id and a.zone_id=b.zone_id and a.metric_date=b.metric_date
    full join pivot_vc c on a.indic_id=c.indic_id and a.zone_id=c.zone_id and a.metric_date=c.metric_date 