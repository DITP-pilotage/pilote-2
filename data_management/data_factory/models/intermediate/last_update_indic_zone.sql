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
		a.date_creation as dernier_import_date,
		concat(UPPER(LEFT(u.prenom,1)),LOWER(SUBSTRING(u.prenom,2,LENgth(u.prenom))) , ' ', UPPER(LEFT(u.nom,1)),LOWER(SUBSTRING(u.nom,2,LENgth(u.nom)))) as dernier_import_auteur
	from sort_import_terr a
	left join rapport_import_mesure_indicateur b on a.rapport_id=b.id
	left join utilisateur u on b.utilisateur_email=u.email
	where r=1
	order by indic_id, zone_id
)



select * from indic_zone_last_import
