{{ config(
    enabled=true,
    tags=["df2", "scope_chantier"],
    severity = "error",
    store_failures = false,
    limit = 100,
) }}

-- Vérifie que l'on a bien le même nombre de VA
WITH original AS (
    SELECT id, territoire_code, COALESCE(array_length(evolution_valeur_actuelle, 1),-1) as cnt_original FROM {{ ref('indicateur') }}
),
df2 as (
    SELECT id, territoire_code, COALESCE(array_length(evolution_valeur_actuelle, 1), -1) as cnt_df2 FROM {{ ref('df2_indicateur') }}
),
same_length_t AS (
    SELECT a.*, b.cnt_df2 , cnt_original=cnt_df2 AS va_same_length FROM original a FULL JOIN df2 b ON a.id=b.id AND a.territoire_code=b.territoire_code
)

SELECT * from same_length_t where va_same_length=false


