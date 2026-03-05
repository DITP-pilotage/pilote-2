





with validation_errors as (

    select
        indic_id, metric_type, metric_date, zone_id
    from "dev_pilote__6230"."df3"."mesure_last"
    group by indic_id, metric_type, metric_date, zone_id
    having count(*) > 1

)

select *
from validation_errors


