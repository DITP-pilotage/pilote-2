
with 

-- Tableau des chantier à répliquer de maille X -> Y
src_chantier_mailles_to_replicate as (
SELECT * FROM (VALUES 
('CH-006', 'DEPT', 'REG'), ('CH-015', 'DEPT', 'REG')
) AS t (chantier_id,replicate_maille_to, replicate_maille_from)
where chantier_id='CH-006' --and zone_id_parent='R84'
)
-- Liste des zones où répliquer les données
, src_chantier_zones_to_replicate as (
select a.chantier_id, b.zone_id, b.zone_type, b.zone_parent as zone_id_parent, b.zone_parent_type as zone_type_parent from src_chantier_mailles_to_replicate a
left join df3.zone_parent b on a.replicate_maille_from=b.zone_parent_type and a.replicate_maille_to=b.zone_type
)
-- Valeurs de la maille sup (X)
, valeurs_region_src as (
select b.chantier_id , a.*  from df3.mesure_last_null_erase_keep_lastvalmonth a
left join raw_data.stg_ppg_metadata__indicateurs b on a.indic_id =b.id
inner join src_chantier_zones_to_replicate c on c.zone_id_parent=a.zone_id and c.chantier_id=b.chantier_id
--where b.chantier_id ='CH-006' and a.zone_id = 'R84'
)


-- Valeurs de la maille sup (X) bien formaté
, valeurs_region as (
select 
date_import, indic_id, metric_date, metric_type, metric_value, 
null as zone_id, 
zone_id as zone_id_parent, 
null as id, 
rapport_id
 from valeurs_region_src
)

-- Valeurs répliquées (dans Y)
, replicated_values as (
select 
date_import, indic_id, metric_date, metric_type, metric_value, 
b.zone_id as zone_id,
gen_random_uuid() as id,
rapport_id
--, b.*
from valeurs_region a
cross join src_chantier_zones_to_replicate b
)


--select indic_id, zone_id, count(*) as n from replicated_values group by indic_id, zone_id

select * from replicated_values


