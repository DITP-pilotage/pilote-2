{{ config(materialized = 'table') }}

-- Si plusieurs valeurs existent pour un même couple
--  {indic_id, zone_id , metric_type, mois}, on garde celle importée le plus récemment

with rank_values_month as (
    select 
    date_import, indic_id,
    to_char(date_trunc('month', metric_date::date),'YYYY-MM-DD') as metric_date, 
    metric_type, metric_value, zone_id, id, rapport_id,
    rank() over (partition by 
        indic_id,
        zone_id,
        metric_type,
        date_trunc('month', metric_date::date)
        order by
            date_import::timestamp desc,
            metric_date::timestamp desc
    ) as r
from {{ ref('mesure_last_null_erase') }} )

select * from rank_values_month where r=1
