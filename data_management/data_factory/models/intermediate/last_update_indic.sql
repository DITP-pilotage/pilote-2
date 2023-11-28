with 
-- Pour chaque indicateur, on garde le dernier import
indic_last_import as (
	select
*,
	last_value(dernier_import_rapport_id) over w as dernier_import_rapport_id_indic,
	last_value(dernier_import_date) over w as dernier_import_date_indic,
	last_value(dernier_import_auteur) over w as dernier_import_auteur_indic
	from {{ ref('last_update_indic_zone') }}
		window w as (partition by indic_id order by dernier_import_date rows between UNBOUNDED PRECEDING and UNBOUNDED FOLLOWING)
	order by indic_id, zone_id
),
-- on garde une seule ligne par indicateur
dernier_import_indic as (
	select indic_id, dernier_import_rapport_id_indic, dernier_import_date_indic, dernier_import_auteur_indic, count(indic_id) as n
	from indic_last_import
	group by indic_id, dernier_import_rapport_id_indic, dernier_import_date_indic, dernier_import_auteur_indic
)

select * from dernier_import_indic