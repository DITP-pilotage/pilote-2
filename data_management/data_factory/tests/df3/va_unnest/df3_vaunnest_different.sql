{{ config(enabled=true, tags=["scope_indicateur", "metric_vaunnest"]) }}

-- Ce test va vérifier pour chaque VA disposant d'une VA dans la
--  table computed et la table de reference si la VA est IDENTIQUE

with
-- Unnest les VA calculées
unnest_va_computed as (
	select * from {{ ref('df3_indicateur_unnest_va') }}
),
-- Unnest les VA existantes
unnest_va_target as (
	select id, territoire_code, 
    unnest(evolution_valeur_actuelle) as va_unnest_target, 
    unnest(evolution_date_valeur_actuelle) as va_date_unnest_target
    from {{ ref('indicateur') }} di 
)

-- Jointure avec la table des résultats attendus
select a.*, b.va_unnest_target, b.va_date_unnest_target 
from unnest_va_computed a
full join unnest_va_target b 
on
    -- Jointure sur l'indicateur, zone, et date de la VA
    a.id=b.id and 
    a.territoire_code=b.territoire_code and 
    a.va_date_unnest_computed=b.va_date_unnest_target
-- Condition du test
where (b.va_unnest_target is not null and a.va_unnest_computed is not null) AND
    (b.va_unnest_target <> a.va_unnest_computed)