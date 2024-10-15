-- Pour chaque zone, on récupère tous ses parents
--	Utile pour les aggrégations géographiques.

-- Unnest des parent
with zones_unnest_parent as (
    select a.id as zone_id , a.maille as zone_type, unnest(string_to_array(a.zone_parent, ' | ')) as zone_parent 
    from {{ ref('stg_ppg_metadata__zones') }} a
),
-- Ajout du type de zone des parents
zones_parent_type as (
    select a.*, b.maille as zone_parent_type, b.zone_parent as zone_parent_parent 
    from zones_unnest_parent a 
    left join {{ ref('stg_ppg_metadata__zones') }} b 
    ON a.zone_parent = b.id )


select * from zones_parent_type
