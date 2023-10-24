-- Pour obtenir la VIG et sa date pour chaque indicateur
-- Il s'agit de la 1e VI OU de la 1e VA si aucune VI n'existe


with 
-- on trie les vi NON NULL par date croissante
vi_non_null_sorted as (
	select indic_id, zone_id, metric_date, vi,
	rank() over (partition by indic_id, zone_id order by metric_date asc) as r
	from {{ ref('pivot_mesures') }}
	-- vi NON NULL
	where vi is not null and
	-- vig_min_date: aucune VI globale ne pourra être avant cette date
    metric_date::date >= '{{ var('vig_min_date') }}'::date
),

-- on trie les va NON NULL par date croissante
va_non_null_sorted as (
	select indic_id, zone_id, metric_date, va,
	rank() over (partition by indic_id, zone_id order by metric_date asc) as r
	from {{ ref('pivot_mesures') }}
	-- va NON NULL
	where va is not null and
	-- vig_min_date: aucune VI globale ne pourra être avant cette date
    metric_date::date >= '{{ var('vig_min_date') }}'::date
),
-- La première VA pour chaque [indic,zone]
get_va_early as (
select indic_id , zone_id , metric_date as va_earliest_date, va as va_earliest
from va_non_null_sorted
where r=1),

-- La première VI pour chaque [indic,zone]
get_vig as (
select indic_id , zone_id , metric_date as vig_date, vi as vig
from vi_non_null_sorted
where r=1
)

-- On sélectionne la première VI si existe, et is_from_vi=TRUE
--  sinon, la première VA, et is_from_vi=FALSE
select 
    coalesce(a.indic_id, b.indic_id) as indic_id,
    coalesce(a.zone_id, b.zone_id) as zone_id,
    -- selection de la valeur
    coalesce(a.vig, b.va_earliest) as vig,
    -- selection de la date
    case
        when a.vig is not null then a.vig_date
        else b.va_earliest_date
    end as vig_date,
    -- is_from_vi: VRAI si la valeur est issue d'une VI, FAUX si elle est issue d'une VA
    (a.vig is not null) as is_from_vi
from get_vig a
full join get_va_early b
on a.indic_id=b.indic_id and a.zone_id=b.zone_id

