



select
    1
from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__ppgs"

where not(id SIMILAR TO 'PPG-(\d|[A-Z]){1,3}')

