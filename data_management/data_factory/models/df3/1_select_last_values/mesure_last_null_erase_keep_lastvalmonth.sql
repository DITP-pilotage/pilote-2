{{ config(materialized = 'table') }}

-- Si plusieurs valeurs existent pour un même couple
--  {indic_id, zone_id , metric_type, mois}, on garde la plus tardive

with rank_values_month as (
    select *,
    rank() over (partition by 
        indic_id,
        zone_id,
        metric_type,
        date_trunc('month', metric_date::date)
        order by metric_date::date desc
    ) as r
from {{ ref('mesure_last_null_erase') }} )

select * from rank_values_month where r=1