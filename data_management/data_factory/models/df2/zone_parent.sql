-- Pour chaque zone, on récupère tous ses parents
--	Utile pour les aggrégations géographiques.

-- Unnest des parent
with zones_unnest_parent as (
    select a.zone_id , a.zone_type , unnest(string_to_array(a.zone_parent, ' | ')) as zone_parent 
    from {{ ref('metadata_zones') }} a
),
-- Ajout du type de zone des parents
zones_parent_type as (
    select a.*, b.zone_type  as zone_parent_type, b.zone_parent as zone_parent_parent 
    from zones_unnest_parent a 
    left join {{ ref('metadata_zones') }} b 
    ON a.zone_parent = b.zone_id )


select * from zones_parent_type