{{ config(materialized='table') }}

select 
    id, territoire_code, 
    unnest(evolution_valeur_actuelle) as va_unnest_computed, 
    unnest(evolution_date_valeur_actuelle)::date as va_date_unnest_computed 
from {{ ref('df3_indicateur') }}
