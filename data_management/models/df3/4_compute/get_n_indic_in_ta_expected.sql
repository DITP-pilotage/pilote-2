with src as (
	select * from {{ ref('int_ponderation_reelle') }}
)

select chantier_id, zone_id, count(zone_id) as n_indic_in_ta_expected from src
where poids_zone_reel > 0
group by chantier_id, zone_id
order by chantier_id, zone_id
