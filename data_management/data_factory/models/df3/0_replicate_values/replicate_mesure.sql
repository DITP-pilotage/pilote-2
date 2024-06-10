
with 

src_chantier_zones_to_replicate as (
SELECT * FROM (VALUES 
('CH-006', 'R84'), ('CH-006', 'R11'), ('CH-015', 'R11')
) AS t (chantier_id,zone_id_parent)
where chantier_id='CH-006' --and zone_id_parent='R84'
)

, valeurs_region_src as (
select b.chantier_id , a.*  from df3.mesure_last a
left join raw_data.stg_ppg_metadata__indicateurs b on a.indic_id =b.id
right join src_chantier_zones_to_replicate c on c.zone_id_parent=a.zone_id and c.chantier_id=b.chantier_id
--where b.chantier_id ='CH-006' and a.zone_id = 'R84'
)



, valeurs_region as (
select 
date_import, indic_id, metric_date, metric_type, metric_value, 
null as zone_id, 
zone_id as zone_id_parent, 
null as id, 
rapport_id
--'6b194d3a-a821-4638-9f7f-3b71abc3f126'::uuid as rapport_id
 from valeurs_region_src
)



, zones_to_replicate as (
 select * from raw_data.stg_ppg_metadata__zones_unnest a 
 right join src_chantier_zones_to_replicate b on a.zone_id_parent=b.zone_id_parent
 -- TODO
where zone_type='DEPT'
	--and  zone_id_parent='R11'
)
--select * from zones_to_replicate

, replicated_values as (
select 
date_import, indic_id, metric_date, metric_type, metric_value, 
b.zone_id as zone_id,
gen_random_uuid() as id,
rapport_id,
b.* from valeurs_region a
cross join zones_to_replicate b
order by b.zone_nom, a.metric_date
)

select * from replicated_values






