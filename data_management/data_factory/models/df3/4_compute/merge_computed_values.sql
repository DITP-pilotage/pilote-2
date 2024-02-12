{{ config(materialized='table') }}

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

select 
a.*,
b.vaca,
c.vacg,
-- VCA pour l'année COURANTE (rule::620)
d2.vca as vca_courant, d2.vca_date as vca_date_courant,
-- VCA pour l'année de la a.metric_date (pas utilisé, mais valeur avant rule::620)
d.vca as vca_a_date, d.vca_date as vca_date_a_date,
e.vig, e.vig_date,
f.vcg, f.vcg_date
from {{ ref('pivot_mesures') }} a
left join {{ ref('compute_vaca') }} b on a.indic_id =b.indic_id and a.zone_id =b.zone_id and a.metric_date = b.metric_date 
left join {{ ref('compute_vacg') }} c on a.indic_id =c.indic_id and a.zone_id =c.zone_id and a.metric_date = c.metric_date 
-- La VCA ici est à l'année de la VA (année de a.metric_date)
left join {{ ref('get_vca') }} d on a.indic_id =d.indic_id and a.zone_id =d.zone_id and date_part('year', a.metric_date::date)=d.yyear 
-- La VCA ici est en date de l'année courante
left join (select * from {{ ref('get_vca') }} where yyear=(date_part('year', now()))) d2 on a.indic_id =d2.indic_id and a.zone_id =d2.zone_id
left join {{ ref('get_vig') }} e on a.indic_id =e.indic_id and a.zone_id =e.zone_id
left join {{ ref('get_vcg') }} f on a.indic_id =f.indic_id and a.zone_id =f.zone_id
