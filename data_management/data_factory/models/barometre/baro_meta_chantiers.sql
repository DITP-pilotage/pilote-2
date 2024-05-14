with chantiers_baro as (
-- ID des chantiers dans le baromètre
select indic_parent_ch as chantier_id, count(*) as n 
from {{ ref('baro_meta_indicateurs') }} 
group by indic_parent_ch 
order by indic_parent_ch)

-- On ajoute le nom et l'engagement correspondant pour chaque chantier
select a.chantier_id, b.ch_nom, b.engagement_short 
from chantiers_baro as a
left join {{ ref('metadata_chantiers') }} b on a.chantier_id=b.chantier_id 
