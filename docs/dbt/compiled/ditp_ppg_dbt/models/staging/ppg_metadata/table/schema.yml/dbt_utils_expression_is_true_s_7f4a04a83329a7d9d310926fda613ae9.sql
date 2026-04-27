



select
    1
from (select * from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" where replicate_val_reg_to IS NOT NULL) dbt_subquery

where not(replicate_val_reg_to = 'DEPT')

