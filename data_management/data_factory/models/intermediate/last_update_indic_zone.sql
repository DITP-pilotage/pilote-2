-- Pour chaque rapport, on lui associe l'indic_id de l'indicateur qui est modifié
with indic_rapport as (
	select rapport_id, indic_id, zone_id, count(rapport_id) as n
	from  {{ source('import_from_files', 'mesure_indicateur') }} mi
	group by rapport_id, indic_id, zone_id
),
-- On associe la date à ce rapport
indic_rapport_date as (
	select a.*, b.date_creation from indic_rapport a left join {{ source('db_schema_public', 'rapport_import_mesure_indicateur') }} b
	on a.rapport_id = b.id
	order by indic_id, zone_id
),
-- On trie par date tous les imports pour chaque indicateur
--		La valeur r==1 correspond au dernier import pour cet indicateur
sort_import as (
select *, rank() over (partition by indic_id, zone_id order by date_creation desc) as r from indic_rapport_date
),
-- On ajoute le territoire_code
sort_import_terr as (
	select a.*, b.code as territoire_code
	from sort_import a left join {{ source('db_schema_public', 'territoire') }} b 
	on a.zone_id=b.zone_id
),
-- Pour chaque {indicateur-zone}, on garde le dernier import
indic_zone_last_import as (
	select
		indic_id,
		zone_id,
		territoire_code,
		rapport_id as dernier_import_rapport_id,
		date_creation as dernier_import_date	
	from sort_import_terr where r=1
	order by indic_id, zone_id
),




-- Pour chaque indicateur, on garde le dernier import
indic_last_import as (
	select
*,
	last_value(dernier_import_rapport_id) over w as dernier_import_rapport_id_indic,
	last_value(dernier_import_date) over w as dernier_import_date_indic
	from indic_zone_last_import
		window w as (partition by indic_id order by dernier_import_date rows between UNBOUNDED PRECEDING and UNBOUNDED FOLLOWING)
	order by indic_id, zone_id
),
-- on garde une seule ligne par indicateur
dernier_import_indic as (
	select indic_id, dernier_import_rapport_id_indic, dernier_import_date_indic, count(indic_id) as n
	from indic_last_import
	group by indic_id, dernier_import_rapport_id_indic, dernier_import_date_indic
)



select * from indic_zone_last_import
