



select
    1
from (select * from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" where ate IS NOT NULL) dbt_subquery

where not(ate ::TEXT = LOWER(ate::TEXT))

