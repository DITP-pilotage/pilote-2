-- Objectif: retourner uniquement la valeur importée le plus récemment 
--  pour chaque {indic_id, metric_type, metric_date, zone_id}

with
-- Pour chaque {indic_id, mois, metric_type, zone_id}, indique s'il y a un NULL comme valeur de rank 1
compute_month_contains_null as (
	select 
	indic_id, date_trunc('month', metric_date::date) as mmonth, metric_type, zone_id,
	-- Liste des valeurs pour ce mois
	-- array_agg(metric_value) as all_metric_value,
	-- Retourne TRUE is un NULL est contenu dans la liste des valeurs pour ce mois
	true=ANY (SELECT unnest((array_agg(metric_value))) IS NULL) as month_contains_null
	from {{ ref('mesure_last') }}
	group by indic_id, date_trunc('month', metric_date::date), metric_type, zone_id
),
-- Table "mesure_last" à laquelle on enlève les valeurs
--  pour lesquelles on a un NULL comme valeur de rank 1 (valeur valable) pour n'importe quel jour du mois de cette valeur
mesure_last_no_value_month_if_null as (

    select a.*
        --, b.month_contains_null
        --, b.month_contains_null and (metric_value is not null) as to_delete
    from {{ ref('mesure_last') }} a
    left join compute_month_contains_null b 
    on a.indic_id=b.indic_id and a.metric_type=b.metric_type and a.zone_id=b.zone_id and date_trunc('month', a.metric_date::date)=b.mmonth
    -- On supprime les lignes si:
    --		- le mois contient un NULL (month_contains_null=TRUE)
    --		- ET que la valeur n'est pas ce NULL en question. Ainsi, on continue de propager les NULL saisis
    where not (b.month_contains_null and (metric_value is not null))
)

select * from mesure_last_no_value_month_if_null