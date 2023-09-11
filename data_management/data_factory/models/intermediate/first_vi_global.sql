{{ config(tags="scope_chantier") }}

-- Add year
with pivot_faits_indicateur_toutes_mailles_year as (
    select *, extract('year' from date_releve) as yyear from {{ ref('pivot_faits_indicateur_toutes_mailles') }}
),
-- VI with first date for each {indic_id, zone_id}
rank_vi_year as (
    select indicateur_id, zone_id, date_releve, valeur_initiale, yyear,
rank() over(partition by indicateur_id, zone_id  order by date_releve asc) as r
FROM pivot_faits_indicateur_toutes_mailles_year where valeur_initiale is not null
)
-- Keep VI with oldest date for each {indic_id, zone_id}
select * from rank_vi_year  where r=1