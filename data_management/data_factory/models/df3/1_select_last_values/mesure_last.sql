-- Objectif: retourner uniquement la valeur importée le plus récemment 
--  pour chaque {indic_id, metric_type, metric_date, zone_id}

with 
-- Cette table intermédiaire créé la colonne metric_date_fixed
--  qui contient les valeurs de metric_date SAUF 
--  pour 2023-06-31 qui est transformé en 2023-06-30
--  (erreur de saisie au début de vie de l'appli)
fix_mesure_indicateur_06_31 as (
    select * ,
    CASE
        WHEN metric_date='2023-06-31' THEN '2023-06-30'
        ELSE metric_date
    END as metric_date_fixed
    from {{ source('import_from_files', 'mesure_indicateur') }}
),

rank_mesures as (
select *,
-- On trie, pour chaque {indic_id, metric_type, metric_date_fixed, zone_id}, les valeurs par date d'import la plus récente
row_number() over (partition by indic_id, metric_type, metric_date_fixed, zone_id order by date_import desc) as r
from fix_mesure_indicateur_06_31
),
-- et on garde pour chacun de ces groupes la plus récente
rank_mesures_1 as (
    select * from rank_mesures where r=1
),
-- Nettoyage des valeurs 'null' et '' vers NULL
rank_mesures_1_cleaned as (
    select 
        date_import, indic_id, 
        metric_date_fixed as metric_date,
        metric_type,
        case 
            WHEN metric_value IN ('', 'null', 'undefined') THEN null
            else metric_value
        end as metric_value,
        zone_id, id, rapport_id
    from rank_mesures_1
),
-- Pour chaque {indic_id, mois, metric_type, zone_id}, indique s'il y a un NULL comme valeur de rank 1
compute_month_contains_null as (
	select 
	indic_id, date_trunc('month', metric_date::date) as mmonth, metric_type, zone_id,
	-- Liste des valeurs pour ce mois
	-- array_agg(metric_value) as all_metric_value,
	-- Retourne TRUE is un NULL est contenu dans la liste des valeurs pour ce mois
	true=ANY (SELECT unnest((array_agg(metric_value))) IS NULL) as month_contains_null
	from rank_mesures_1_cleaned
	group by indic_id, date_trunc('month', metric_date::date), metric_type, zone_id
),
-- Table précédente à laquelle on a enlevé les valeurs
--  pour lesquelles on a un NULL comme valeur de rank 1 (valeur valable) pour n'importe quel jour du mois de cette valeur
rank_mesures_1_cleaned_no_value_month_if_null as (

    select a.*
        --, b.month_contains_null
        --, b.month_contains_null and (metric_value is not null) as to_delete
    from rank_mesures_1_cleaned a
    left join compute_month_contains_null b 
    on a.indic_id=b.indic_id and a.metric_type=b.metric_type and a.zone_id=b.zone_id and date_trunc('month', a.metric_date::date)=b.mmonth
    -- On supprime les lignes si:
    --		- le mois contient un NULL (month_contains_null=TRUE)
    --		- ET que la valeur n'est pas ce NULL en question. Ainsi, on continue de propager les NULL saisis
    where not (b.month_contains_null and (metric_value is not null))
)

select * from rank_mesures_1_cleaned_no_value_month_if_null