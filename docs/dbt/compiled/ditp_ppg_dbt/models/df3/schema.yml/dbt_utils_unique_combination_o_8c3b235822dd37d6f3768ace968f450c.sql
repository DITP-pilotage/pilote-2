





with validation_errors as (

    select
        date_import, indic_id, metric_type, metric_date, zone_id
    from "dev_pilote__6230"."df3"."stg_mesure_indicateur"
    group by date_import, indic_id, metric_type, metric_date, zone_id
    having count(*) > 1

)

select *
from validation_errors


