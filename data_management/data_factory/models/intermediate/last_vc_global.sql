{{ config(tags="scope_chantier") }}

-- Add year
with pivot_faits_indicateur_toutes_mailles_year as (
    select *, extract('year' from date_releve) as yyear from {{ ref('pivot_faits_indicateur_toutes_mailles') }}
),
-- VC with last date for each {indic_id, zone_id, year}
rank_vc_year as (
    select indicateur_id, zone_id, date_releve, valeur_cible, yyear,
rank() over(partition by indicateur_id, zone_id  order by date_releve desc) as r
FROM pivot_faits_indicateur_toutes_mailles_year where valeur_cible is not null
)
-- Keep VC with latest date for each year
select * from rank_vc_year where r=1


