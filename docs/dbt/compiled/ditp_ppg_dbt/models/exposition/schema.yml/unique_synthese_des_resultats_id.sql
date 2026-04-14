
    
    

select
    id as unique_field,
    count(*) as n_records

from "dev_pilote__6230"."public"."synthese_des_resultats"
where id is not null
group by id
having count(*) > 1


