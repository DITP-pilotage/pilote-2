{{ config(enabled=true, tags=["scope_indicateur", "metric_vaunnest"]) }}

-- Ce test va vérifier si des VA sont assignées à des dates
--  qui ne sont PAS dans la table de référence.

with
-- Unnest les VA calculées
unnest_va_computed as (
	select * from {{ ref('df3_indicateur_unnest_va') }}
),
-- Unnest les VA existantes
unnest_va_target as (
	select id, territoire_code, 
    unnest(evolution_valeur_actuelle) as va_unnest_target, 
    unnest(evolution_date_valeur_actuelle)::date as va_date_unnest_target
    from {{ ref('indicateur') }} di 
)

-- Jointure avec la table des résultats attendus
select a.*, b.va_unnest_target, b.va_date_unnest_target 
from unnest_va_computed a
full join unnest_va_target b 
on
    -- Jointure sur l'indicateur, zone, et le MOIS de la date de la VA
    a.id=b.id and 
    a.territoire_code=b.territoire_code and 
    date_trunc('month', a.va_date_unnest_computed)=date_trunc('month', b.va_date_unnest_target)
-- Condition du test
where b.va_unnest_target is null and a.va_unnest_computed is not null