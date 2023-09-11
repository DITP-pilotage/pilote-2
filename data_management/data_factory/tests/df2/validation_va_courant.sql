{{ config(
    enabled=true,
    tags=["df2", "scope_chantier", "df2_validation"],
    severity = "error",
    store_failures = false
) }}

-- Retourne les VA qui ne sont pas correctes par rapport à l'attendu
WITH original as (
    SELECT id, territoire_code, valeur_actuelle as va, date_valeur_actuelle as date_va FROM {{ ref('indicateur') }}
), df2 as (
    SELECT id, territoire_code, valeur_actuelle as va_df2, date_valeur_actuelle as date_va_df2 FROM {{ ref('df2_indicateur') }}
), t as (SELECT 0.001 as tolerance),

compute_test as (
    select 
    a.*, b.date_va_df2 ,b.va_df2,
    -- Check if va_df2/va ~= 1
    CASE
        when va=0.0 then abs(va_df2)<t.tolerance
        else abs(1-va_df2/va)<t.tolerance
    end as almost_equal
    from original a left join df2 b on a.id = b.id and a.territoire_code = b.territoire_code, t
)

select * from compute_test where not almost_equal