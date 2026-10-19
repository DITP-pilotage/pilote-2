
    
    

with all_values as (

    select
        param_vaca_decumul_from as value_field,
        count(*) as n_records

    from "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs"
    group by param_vaca_decumul_from

)

select *
from all_values
where value_field not in (
    '_','from_year_start','from_beginning'
)


