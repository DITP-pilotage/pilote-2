{% macro df3_not_equal(colname, tolerance=0)%}

{{ config(
    tags=["df3","df3_validation"],
    severity = "error",
    store_failures = false
) }}


with jjoin as (select 
    coalesce(a.id, b.id) as id, 
    coalesce(a.territoire_code, b.territoire_code) as territoire_code,
    a.{{colname}} as computed_value,
    b.{{colname}} as target_value,
    case
		when a.{{colname}}=0 then null
		when b.{{colname}}=0 then null
		else abs(a.{{colname}}-b.{{colname}})/b.{{colname}}
	end as ratio

    from {{ ref('df3_indicateur') }} a
    full join  {{ ref('indicateur') }} b
    on a.territoire_code=b.territoire_code and a.id=b.id
)

select * from jjoin
where 
	(computed_value is not null and target_value is not null)
    AND (computed_value <> target_value)
    AND (ratio is null or ratio > {{tolerance}})

{% endmacro %}
