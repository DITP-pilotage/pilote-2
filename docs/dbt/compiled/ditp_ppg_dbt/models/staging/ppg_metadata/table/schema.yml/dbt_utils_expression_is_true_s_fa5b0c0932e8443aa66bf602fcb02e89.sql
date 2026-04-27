



select
    1
from "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantier_meteos"

where not(id IN ('SOLEIL', 'COUVERT', 'NUAGE', 'ORAGE'))

