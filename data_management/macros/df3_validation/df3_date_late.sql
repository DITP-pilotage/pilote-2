{% macro df3_date_late(colname_date, ignore_day)%}

{{ config(
    tags=["df3","df3_validation"],
    severity = "error",
    store_failures = false
) }}


with jjoin as (select 
    coalesce(a.id, b.id) as id, 
    coalesce(a.territoire_code, b.territoire_code) as territoire_code,
    a.{{colname_date}} as computed_value,
    b.{{colname_date}} as target_value,
    -- On calcule si on doit ignorer cette ligne dans les résultats des tests en fonction du param "ignore_day"
    case
        -- si ignore_day=TRUE, si le mois est identique => TRUE
        when {{ignore_day}}::bool then date_trunc('month', a.{{colname_date}}) = date_trunc('month', b.{{colname_date}})
        -- si ignore_day=FALSE => FALSE
        else false
    end as ignore_row
    from {{ ref('df3_indicateur') }} a
    full join  {{ ref('df1_indicateur') }} b
    on a.territoire_code=b.territoire_code and a.id=b.id
)

select * from jjoin
where 
    (computed_value is not null and target_value is not null and computed_value::date > target_value::date)
    and not ignore_row

{% endmacro %}
