with indic_baro as (
	select id, est_barometre from raw_data.stg_ppg_metadata__indicateurs where est_barometre),
donnees as (
	select i.* from public.indicateur i
	right join indic_baro b on i.id = b.id
	limit 5000
)

select 
	id as indic_id,
	evolution_date_valeur_actuelle,
	territoire_code,
	evolution_valeur_actuelle as indic_va_evol
from donnees

-- format sortie: indic_id,enforce_zone_id,metric_enforce_date,maille,indic_vi,indic_va,indic_vc,indic_ta

select 
	id as indic_id,
	'todo' as enforce_zone_id,
	'todo' as metric_enforce_date,
	evolution_date_valeur_actuelle as indic_date_va_evol,
	"maille",
	'todo' as indic_vi,
	'todo' as indic_va,
	evolution_valeur_actuelle as indic_va_evol,
	'todo' as indic_vc,
	'todo' as indic_ta, *
from donnees
--select * from indic_baro
