



select
    1
from (select * from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" where zone_groupe_applicable IS NOT NULL) dbt_subquery

where not(zone_groupe_applicable SIMILAR TO 'ZG-\d{3}')

