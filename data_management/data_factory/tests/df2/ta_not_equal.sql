{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Teste si le TA courant est correct lorsque qu'il n'est pas NULL
with original as (select id, territoire_code , objectif_taux_avancement as ta  from {{ ref('indicateur') }} i ),
df2 as (select id, territoire_code , objectif_taux_avancement as ta2 from {{ ref('df2_indicateur') }}),
mmerge as (select a.*, b.ta2 from original a left join df2 b on a.id = b.id and a.territoire_code=b.territoire_code)

select * from mmerge 
    WHERE ta is not null 
    AND ta2 is not null
    AND ta <> ta2