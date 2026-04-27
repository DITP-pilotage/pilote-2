



select
    1
from "dev_pilote__6230"."public"."chantier_identite"

where not(ate IS NULL OR ate IN ('ate', 'hors_ate_centralise', 'hors_ate_deconcentre'))

