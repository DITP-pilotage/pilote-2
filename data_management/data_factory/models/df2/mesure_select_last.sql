-- Objectif: retourner uniquement la valeur importée le plus récemment 
--  pour chaque {indic_id, metric_type, metric_date, zone_id}

with rank_mesures as (
select *,
-- On trie, pour chaque {indic_id, metric_type, metric_date, zone_id}, les valeurs par date d'import la plus récente
row_number() over (partition by indic_id, metric_type, metric_date, zone_id order by date_import desc) as r
from {{ source('import_from_files', 'mesure_indicateur') }}
),
-- et on garde pour chacun de ces groupes la plus récente
rank_mesures_1 as (
    select * from rank_mesures where r=1
),
-- Nettoyage des valeurs 'null' et '' vers NULL
rank_mesures_1_cleaned as (
    select 
        date_import, indic_id, metric_date, metric_type,
        case 
            -- 'null'   -> NULL
            when metric_value='null' then null
            -- ''       -> NULL
            when metric_value='' then null
            else metric_value
        end as metric_value,
        zone_id, id, rapport_id
    from rank_mesures_1
)

select * from rank_mesures_1_cleaned
