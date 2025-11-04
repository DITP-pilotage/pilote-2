{{ config(materialized='table') }}

-- Union de toutes les tables d'aggrégation (DEPT, REG, NAT)
select id, date_import, indic_id, is_last_monthly_value, zone_id, metric_date, metric_type, metric_value::float from {{ ref('agg_dept') }} 
union all
select id, date_import, indic_id, is_last_monthly_value, zone_id, metric_date, metric_type, metric_value from {{ ref('agg_reg') }}
union all
select id, date_import, indic_id, is_last_monthly_value, zone_id, metric_date, metric_type, metric_value from {{ ref('agg_nat_rule544') }}
--order by indic_id, zone_id, metric_date
