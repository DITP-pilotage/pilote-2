{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Détecte si le TA est NULL mais ne devrait pas
with original as (select id, territoire_code , objectif_taux_avancement as ta  from {{ ref('indicateur') }} i ),
df2 as (select id, territoire_code , objectif_taux_avancement as ta2 from {{ ref('df2_indicateur') }}),
mmerge as (select a.*, b.ta2 from original a left join df2 b on a.id = b.id and a.territoire_code=b.territoire_code)

select * from mmerge where 
    ta is not null and ta2 is null