
    
    

select
    chantier_id as unique_field,
    count(*) as n_records

from "dev_pilote__6230"."barometre"."baro_meta_chantiers"
where chantier_id is not null
group by chantier_id
having count(*) > 1


