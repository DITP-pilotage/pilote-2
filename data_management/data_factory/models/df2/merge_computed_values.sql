{{ config(materialized='table') }}

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

select 
a.*,
b.vaca,
c.vacg,
d.vca, d.vca_date,
e.vig, e.vig_date,
f.vcg, f.vcg_date
from {{ ref('pivot_mesures') }} a
left join {{ ref('compute_vaca') }} b on a.indic_id =b.indic_id and a.zone_id =b.zone_id and a.metric_date = b.metric_date 
left join {{ ref('compute_vacg') }} c on a.indic_id =c.indic_id and a.zone_id =c.zone_id and a.metric_date = c.metric_date 
left join {{ ref('get_vca') }} d on a.indic_id =d.indic_id and a.zone_id =d.zone_id and date_part('year', a.metric_date::date)=d.yyear 
left join {{ ref('get_vig') }} e on a.indic_id =e.indic_id and a.zone_id =e.zone_id
left join {{ ref('get_vcg') }} f on a.indic_id =f.indic_id and a.zone_id =f.zone_id
