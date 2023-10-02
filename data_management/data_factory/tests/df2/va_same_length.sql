{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Vérifie que l'on a bien le même nombre de VA
WITH original AS (
    SELECT evolution_valeur_actuelle as e1, id, territoire_code, COALESCE(array_length(evolution_valeur_actuelle, 1),-1) as cnt_original FROM public.indicateur i 
),
df2 as (
    SELECT evolution_valeur_actuelle as e2, id, territoire_code, COALESCE(array_length(evolution_valeur_actuelle, 1), -1) as cnt_df2 from public.df2_indicateur
),
same_length_t AS (
    SELECT e2, a.*, b.cnt_df2 , cnt_original=cnt_df2 AS va_same_length FROM original a FULL JOIN df2 b ON a.id=b.id AND a.territoire_code=b.territoire_code
)

SELECT id, cnt_original, cnt_df2 from same_length_t where not va_same_length


