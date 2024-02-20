with 
-- la pondération définie par le paramétrage sans prendre en compte le zones applicables
get_poids_theorique as (select 
indic_id, poids_pourcent_dept, poids_pourcent_reg, poids_pourcent_nat, t.zone_id, z.zone_type,
case 
	when zone_type='DEPT' then poids_pourcent_dept 
	when zone_type='REG' then poids_pourcent_reg 
	when zone_type='NAT' then poids_pourcent_nat 
end as poids_zone_theorique

from raw_data.metadata_parametrage_indicateurs_temporaire a
cross join public.territoire t
left join raw_data.metadata_zones z on t.zone_id =z.zone_id )



select a.*, b.est_applicable,
case 
	when b.est_applicable then poids_zone_theorique
	-- si l'indic n'est pas applicable sur cette zone, alors la pondération est de 0
	else 0
end as poids_zone_reel
from get_poids_theorique a 
left join marts.int_indicateurs_zones_applicables b on b.indic_id=a.indic_id and b.zone_id=a.zone_id
