with 
-- la pondération définie par le paramétrage sans prendre en compte le zones applicables
-- poids selon la pondération déclarée dans le DF
get_poids_declaree as (select 
indic_id, t.zone_id, 
case 
	when zone_type='DEPT' then poids_pourcent_dept_decla
	when zone_type='REG' then poids_pourcent_reg_decla
	when zone_type='NAT' then poids_pourcent_nat_decla
end as poids_zone_declaree,
ind.chantier_id ,
poids_pourcent_dept_decla, poids_pourcent_reg_decla, poids_pourcent_nat_decla, z.zone_type

from raw_data.metadata_parametrage_indicateurs_temporaire a
cross join public.territoire t
left join raw_data.metadata_zones z on t.zone_id =z.zone_id
left join raw_data.stg_ppg_metadata__indicateurs ind on ind.id = indic_id  
--where ind.chantier_id  ='CH-058'
order by indic_id, t.zone_id 
),
-- poids selon la pond déclarée + zones applicables
get_poids_appl as (
select coalesce(b.est_applicable, true) as est_applicable,
case 
	-- si cet indic n'est pas explicitement signalé NON appl dans cette table, alors il est appl
	when coalesce(b.est_applicable, true) then poids_zone_declaree
	-- si l'indic n'est pas applicable sur cette zone, alors la pondération est de 0
	else 0
end as poids_zone_appl,
a.*
from get_poids_declaree a 
left join marts.int_indicateurs_zones_applicables b on b.indic_id=a.indic_id and b.zone_id=a.zone_id)

, get_total_poids_appl_ch as (
select
chantier_id, zone_id, 
-- Total des pondérations pour ce chantier et cette zone
sum(poids_zone_appl) as total_poids_zone_appl_ch
from get_poids_appl
group by chantier_id, zone_id)

-- Calcul de la pondération réelle
, get_poids_reel as (
select 
case 
	when total_poids_zone_appl_ch=0 then 0
	else 100.*poids_zone_appl/total_poids_zone_appl_ch
end as poids_zone_reel,
b.total_poids_zone_appl_ch,
a.*
from get_poids_appl a 
left join get_total_poids_appl_ch b on a.chantier_id=b.chantier_id and a.zone_id=b.zone_id
)

--select * from get_poids_appl where chantier_id is null -- where total_poids_zone_appl_ch>100

select * from get_poids_reel
-- tests cas intéressants
--where poids_zone_reel>0 and poids_zone_reel<100 and poids_zone_reel<>poids_zone_declaree
--where total_poids_zone_appl_ch <100 and total_poids_zone_appl_ch>0 and poids_zone_appl>0 and poids_zone_appl<>total_poids_zone_appl_ch
order by chantier_id, zone_id



