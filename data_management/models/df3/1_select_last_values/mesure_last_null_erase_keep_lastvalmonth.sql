{{ config(
    materialized = 'table',
) }}

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

-- On garde toutes les VA avec l'info de si c'est la dernière valeur du mois et seulement les dernières valeurs du mois pour les autres types.
select *, r=1 as is_last_monthly_value from rank_values_month where r=1 or metric_type = 'va'
