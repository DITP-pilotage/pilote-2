
-- Union de toutes les tables d'aggrégation (DEPT, REG, NAT)
select indic_id, zone_id, metric_date, metric_type, metric_value::float from {{ ref('agg_dept') }} 
union
select * from {{ ref('agg_reg') }}
union
select * from {{ ref('agg_nat') }}