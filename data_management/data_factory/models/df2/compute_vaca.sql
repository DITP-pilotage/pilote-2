-- Détermine le valeurs de VACA pour chaque mesure

-- on joint les mesures avec les params associés
with mesures_and_params as (
    select 
    a.*,
    b.param_vaca_decumul_from ,
    b.param_vaca_partition_date,
    b.param_vaca_op 
    from {{ ref('pivot_mesures') }} a
    left join {{ ref('metadata_parametrage_indicateurs') }} b on a.indic_id=b.indic_id
),

-- On détermine la date de décumul des VA
add_decumul_start_date as (
    select *,
    -- Date pour effectuer le decumul des VA
    case 
        -- Si from_year_start -> 1er janvier de l'année de la mesure
        when param_vaca_decumul_from='from_year_start' then date_trunc('year', metric_date::date)
        -- Si from_custom_date::X -> date X
        WHEN param_vaca_decumul_from like 'from_custom_date::%' THEN split_part(param_vaca_decumul_from, 'from_custom_date::', 2)::date
        -- Sinon, pas de date de début de décumul
        else null
    end as decumul_vaa_date,
    -- Date pour effectuer le calcul des VACA
    case
		-- Si from_year_start -> 1er janvier de l'année de la mesure
        when param_vaca_partition_date='from_year_start' then date_trunc('year', metric_date::date)
        -- Si from_custom_date::X -> date X
        WHEN param_vaca_partition_date like 'from_custom_date::%' THEN split_part(param_vaca_partition_date, 'from_custom_date::', 2)::date
        -- Sinon, pas de date de début de décumul
        else null
	end as vaca_partition_date
    from mesures_and_params
),

-- On fait le décumul
perform_decumul as (
    select *,
    case 
        -- pas de calcul de va_decumul si pas de va
        when va is null then null
        -- Si '_' -> on retourne va car pas de décumul demandé
        when param_vaca_decumul_from='_' then va
        -- Sinon, on soustraite la va courante à la va précédente, dans la limite de la fenetre définie par decumul_vaa_date
        else coalesce(va - lag(va, 1) over (partition by indic_id, zone_id, decumul_vaa_date order by metric_date::date), va)
    end as va_decumul
    from add_decumul_start_date
),
-- Calcul du VACA
compute_vaca as (
    select *,
    case 
        -- pas de calcul de vaca si pas de va 
        when va is null then null
        -- Si 'current_value' -> on retourne directement va_decumul sans plus de calcul 
        when param_vaca_op='current_value' then va_decumul
        when param_vaca_partition_date='_' then va_decumul
        -- sum avec les différentes fenetres autorisées
        WHEN param_vaca_partition_date = 'from_previous_month::48' and param_vaca_op='sum' THEN sum(va_decumul) over w48
        WHEN param_vaca_partition_date = 'from_previous_month::12' and param_vaca_op='sum' THEN sum(va_decumul) over w12
        WHEN param_vaca_partition_date = 'from_previous_month::6' and param_vaca_op='sum' THEN sum(va_decumul) over w6
        WHEN param_vaca_partition_date = 'from_previous_month::3' and param_vaca_op='sum' THEN sum(va_decumul) over w3
        -- avg avec les différentes fenetres autorisées
        WHEN param_vaca_partition_date = 'from_previous_month::48' and param_vaca_op='moy' THEN avg(va_decumul) over w48
        WHEN param_vaca_partition_date = 'from_previous_month::12' and param_vaca_op='moy' THEN avg(va_decumul) over w12
        WHEN param_vaca_partition_date = 'from_previous_month::6' and param_vaca_op='moy' THEN avg(va_decumul) over w6
        WHEN param_vaca_partition_date = 'from_previous_month::3' and param_vaca_op='moy' THEN avg(va_decumul) over w3
        -- si calcul de VACA avec from_year_start
        WHEN param_vaca_partition_date='from_year_start' and param_vaca_op = 'sum' THEN sum(va_decumul) over (partition by indic_id, zone_id, date_trunc('year', metric_date::date) order by metric_date::date)
        WHEN param_vaca_partition_date='from_year_start' and param_vaca_op = 'moy' THEN avg(va_decumul) over (partition by indic_id, zone_id, date_trunc('year', metric_date::date) order by metric_date::date)
        -- si calcul de VACA avec from_custom_date
        WHEN param_vaca_partition_date like 'from_custom_date::%' and param_vaca_op = 'sum' THEN sum(va_decumul) over (partition by indic_id, zone_id, vaca_partition_date order by metric_date::date)
        WHEN param_vaca_partition_date like 'from_custom_date::%' and param_vaca_op = 'moy' THEN avg(va_decumul) over (partition by indic_id, zone_id, vaca_partition_date order by metric_date::date)
        else null
    end as vaca
    from perform_decumul
    window 
        w48 as (PARTITION BY indic_id, zone_id  ORDER BY date_trunc('month', metric_date::date) asc RANGE BETWEEN INTERVAL '47 months' PRECEDING AND CURRENT ROW),
        w12 as (PARTITION BY indic_id, zone_id  ORDER BY date_trunc('month', metric_date::date) asc RANGE BETWEEN INTERVAL '11 months' PRECEDING AND CURRENT ROW),
        w6 as (PARTITION BY indic_id, zone_id  ORDER BY date_trunc('month', metric_date::date) asc RANGE BETWEEN INTERVAL '5 months' PRECEDING AND CURRENT ROW),
        w3 as (PARTITION BY indic_id, zone_id  ORDER BY date_trunc('month', metric_date::date) asc RANGE BETWEEN INTERVAL '2 months' PRECEDING AND CURRENT ROW)

)

select * from compute_vaca