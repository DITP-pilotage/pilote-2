-- Pour chaque zone-group, retourne autant de ligne que de zones enfant

with init as (
	select  * from raw_data.metadata_zonegroup mz2 
),
-- On sépare la liste des zg_zones, 1 par ligne
unnest_trgt as (
select *, unnest(string_to_array(zg_zones, ' | ')) as zg_zones_unnest from init
),
-- On sépare X.Y (ex: R84.DEPT) en 2, pour avoir la zone parente, et le type de zone enfant
get_child_zone_types as (
select *, 
split_part(zg_zones_unnest, '.', 1) as zone_parent,
split_part(zg_zones_unnest, '.', 2) as child_zone_type
 from unnest_trgt),
-- On sépare les différents parents, 1 par ligne
unnest_parents as (
select *, unnest(string_to_array(zone_parent, ' | ')) as parent from raw_data.metadata_zones mz 
),
-- On fait la jointure pour trouver toutes les zones enfant de X avec le type Y
find_children as (
    select * from get_child_zone_types a left join unnest_parents b on a.zone_parent=b.parent and a.child_zone_type=b.zone_type
), 
-- Si la zone initiale ne demandait pas de zone enfant (ex: D22), on retourne cette zone
fill_zone_no_child as (
	select *, coalesce(zone_id, zg_zones_unnest) as zone_id_filled from find_children
),
-- Sélection de colonnes
clean_results as (
    select zone_group_id, zone_id_filled as child_zone_id from fill_zone_no_child
)

select * from clean_results order by zone_group_id