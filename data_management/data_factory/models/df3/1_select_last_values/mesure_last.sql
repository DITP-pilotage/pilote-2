-- Objectif: retourner uniquement la valeur importée le plus récemment 
--  pour chaque {indic_id, metric_type, metric_date, zone_id}

with 
-- Cette table intermédiaire créé la colonne metric_date_fixed
--  qui contient les valeurs de metric_date SAUF 
--  pour 2023-06-31 qui est transformé en 2023-06-30
--  (erreur de saisie au début de vie de l'appli)
fix_mesure_indicateur_06_31 as (
    select a.* ,
    CASE
        WHEN metric_date='2023-06-31' THEN '2023-06-30'
        ELSE metric_date
    END as metric_date_fixed
    from {{ source('import_from_files', 'mesure_indicateur') }} a
	INNER JOIN {{ ref('metadata_indicateurs') }} b on a.indic_id=b.indic_id 
    left join {{ ref('int_indicateurs_zones_applicables') }} c on a.indic_id=c.indic_id and a.zone_id=c.zone_id
    WHERE 
	    -- On ne garde que les indics qui ne sont pas cachés
    	NOT coalesce(b.indic_hidden_pilote::text::bool, false)
		-- On ne garde que les valeurs sur un territoire applicable  
		AND coalesce(c.est_applicable, true)
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
)

select * from rank_mesures_1_cleaned