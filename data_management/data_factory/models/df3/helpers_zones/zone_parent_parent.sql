-- Pour chaque zone, on récupère tous ses parents, et grand parents ainsi que leur type de zone
--	Utile pour les aggrégations géographiques.

WITH
-- Unnest des parents des parents
zones_unnest_parent_parent as (
    select  zone_id, zone_type, zone_parent, zone_parent_type, unnest(string_to_array(zone_parent_parent, ' | ')) as zone_parent_parent  
    from {{ ref('zone_parent') }} 
),
-- Ajout du type de zone des parents parents
zones_parent_parent_type as (
    select a.*, b.zone_type  as zone_parent_parent_type, b.zone_parent as zone_parent_parent_parent 
    from zones_unnest_parent_parent a 
    left join {{ ref('metadata_zones') }} b 
    ON a.zone_parent_parent = b.zone_id ),

-- on supprime les doublons de parent_parent
-- Ainsi, si X a comme parent_parent Y, il n'y aura qu'une ligne pour le spécifier
zone_parent_parent_dedup as (
    select distinct 
        zone_id,
        zone_type,
        zone_parent_parent , zone_parent_parent_type , zone_parent_parent_parent 
    from zones_parent_parent_type)

select * from zone_parent_parent_dedup