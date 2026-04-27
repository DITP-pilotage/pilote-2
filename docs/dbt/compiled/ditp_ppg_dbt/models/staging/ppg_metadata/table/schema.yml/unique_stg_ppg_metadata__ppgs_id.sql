
    
    

select
    id as unique_field,
    count(*) as n_records

from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__ppgs"
where id is not null
group by id
having count(*) > 1


