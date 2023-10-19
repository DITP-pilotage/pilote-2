{% macro df3_should_null(colname)%}

{{ config(
    tags=["df3","df3_validation"],
    severity = "error",
    store_failures = false
) }}


with jjoin as (select 
    coalesce(a.id, b.id) as id, 
    coalesce(a.territoire_code, b.territoire_code) as territoire_code,
    a.{{colname}} as computed_value,
    b.{{colname}} as target_value
    from {{ ref('df3_indicateur') }} a
    full join  {{ ref('indicateur') }} b
    on a.territoire_code=b.territoire_code and a.id=b.id
)

select * from jjoin
where 
	(computed_value is not null and target_value is null) 

{% endmacro %}
