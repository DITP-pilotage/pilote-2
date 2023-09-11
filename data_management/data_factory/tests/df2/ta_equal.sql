{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Teste si le TA courant est correct
with a as (select id, territoire_code , objectif_taux_avancement  from {{ ref('indicateur') }} i ),
b as (select id, territoire_code , objectif_taux_avancement  from {{ ref('df2_indicateur') }}),
c as (select a.*, b.objectif_taux_avancement as ta2 from a left join b on a.id = b.id and a.territoire_code=b.territoire_code)

select * from c where objectif_taux_avancement <> ta2