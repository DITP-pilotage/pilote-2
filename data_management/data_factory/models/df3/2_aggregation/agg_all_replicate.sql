{{ config(materialized = 'table') }}

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
left join {{ ref('zone_parent') }} b on a.replicate_maille_from=b.zone_parent_type and a.replicate_maille_to=b.zone_type
)
-- Valeurs de la maille sup (X)
, valeurs_region_src as (
select b.chantier_id , a.*, c.zone_id as zone_id_child  from {{ ref('agg_all') }} a
left join {{ ref('stg_ppg_metadata__indicateurs') }} b on a.indic_id =b.id
inner join src_chantier_zones_to_replicate c on c.zone_id_parent=a.zone_id and c.chantier_id=b.chantier_id
--where b.chantier_id ='CH-006' and a.zone_id = 'R84'
)



-- Valeurs répliquées (dans Y) bien formatées
, replicated_values as (
select 
indic_id,
zone_id_child as zone_id,
metric_date, metric_type, metric_value
--, b.*
from valeurs_region_src a
order by indic_id, metric_date
)


--select indic_id, zone_id, count(*) as n from replicated_values group by indic_id, zone_id

-- Union des données précédentes avec les données répliquées
select * from {{ ref('agg_all') }}
union
select * from replicated_values
