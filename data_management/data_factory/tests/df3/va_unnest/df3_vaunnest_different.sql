{{ config(enabled=true, tags=["scope_indicateur", "metric_vaunnest"]) }}

    -- TOLERANCE de 1 pourcent (cf fin du test)

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
    unnest(evolution_date_valeur_actuelle)::date as va_date_unnest_target
    from {{ ref('indicateur') }} di 
),

compare_values as (
-- Jointure avec la table des résultats attendus
select a.*, b.va_unnest_target, b.va_date_unnest_target,
-- Différence entre le calculé et attendu (en pourcent)
case
	when b.va_unnest_target=0 and a.va_unnest_computed=0 then 0
	when b.va_unnest_target=0 and a.va_unnest_computed<>0 then null
	else 100*(a.va_unnest_computed-b.va_unnest_target)/b.va_unnest_target
end as percent_change
from unnest_va_computed a
full join unnest_va_target b 
on
    -- Jointure sur l'indicateur, zone, et le MOIS de la date de la VA
    a.id=b.id and 
    a.territoire_code=b.territoire_code and 
    date_trunc('month', a.va_date_unnest_computed)=date_trunc('month', b.va_date_unnest_target)
)

select * from compare_values
-- Condition du test
where (va_unnest_target is not null and va_unnest_computed is not null) AND
    (va_unnest_target <> va_unnest_computed) AND
    -- TOLERANCE de 1 pourcent
    (percent_change<-1 or percent_change>1)
    
    