-- Pour chaque rapport, on lui associe l'indic_id de l'indicateur qui est modifié
with indic_rapport as (
	select rapport_id, indic_id, zone_id, count(rapport_id) as n
	from  raw_data.mesure_indicateur mi
	group by rapport_id, indic_id, zone_id
),
-- On associe la date à ce rapport
indic_rapport_date as (
	select a.*, b.date_creation from indic_rapport a left join public.rapport_import_mesure_indicateur b
	on a.rapport_id = b.id
	order by indic_id, zone_id
),
-- On trie par date tous les imports pour chaque indicateur
--		La valeur r==1 correspond au dernier import pour cet indicateur
sort_import as (
select *, rank() over (partition by indic_id, zone_id order by date_creation desc) as r from indic_rapport_date
),
sort_import_terr as (
	select a.*, b.code as territoire_code
	from sort_import a left join public.territoire b 
	on a.zone_id=b.zone_id
),
-- Pour chaque indicateur-zone, on garde le dernier import
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


--select *, rank() over (partition by indic_id order by dernier_import_date desc) as r
--from indic_zone_last_import_terr

-- Attention: le nom des tables et schemas "raw_data.mesure_indicateur" et "public.rapport_import_mesure_indicateur"
-- sont codés en dur dans ce modèle car ce ne sont pas des modèles dbt mais des tables pré-existantes
-- créées par prisma (cf schema.prisma). 
-- Donc pas de certitude sur leur existence au runtime


select a.*, b.dernier_import_rapport_id_indic, b.dernier_import_date_indic
from 
-- table indicateur X date des dernier import de chaque indic-zone
(select id, nom, chantier_id, maille, a.territoire_code, date_valeur_actuelle, valeur_actuelle , dernier_import_date, dernier_import_rapport_id from public.indicateur a left join indic_zone_last_import b on a.id=b.indic_id and a.territoire_code =b.territoire_code where id='IND-207') a --where dernier_import_date is null and valeur_actuelle  is not null
-- X date du dernier import de l'INDICATEUR (pas nécessairement sur cette zone)
left join dernier_import_indic b
on a.id=b.indic_id

order by id, maille
