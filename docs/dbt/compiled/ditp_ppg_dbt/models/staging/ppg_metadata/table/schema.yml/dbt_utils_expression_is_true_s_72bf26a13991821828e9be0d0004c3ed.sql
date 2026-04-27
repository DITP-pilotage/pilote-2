



select
    1
from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers"

where not(id SIMILAR TO 'CH-\d{3}')

