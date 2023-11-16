with expanded_ta_zones as (
	
	select b.indic_parent_ch as chantier_id, territoire_code, c.zone_id , z.zone_type as "maille", id , ponderation_dept , ponderation_reg , ponderation_nat, 
	objectif_taux_avancement_intermediaire , objectif_date_valeur_cible_intermediaire,
	objectif_taux_avancement, objectif_date_valeur_cible 
	from {{ ref('df3_indicateur') }} a
	left join {{ ref('metadata_indicateurs') }} b on a.id=b.indic_id 
	-- TODO fix with dbt sources
    left join territoire c on a.territoire_code =c.code  
	left join {{ ref('metadata_zones') }} z on c.zone_id =z.zone_id  
	where objectif_taux_avancement is not null
	order by chantier_id, territoire_code, id

),
-- On calcule les TA pondérées pour chaque zone et chaque indicateur
compute_ta_pond as (
	select *,
	case 
		when maille='DEPT' then objectif_taux_avancement_intermediaire*0.01*ponderation_dept
		when maille='REG' then objectif_taux_avancement_intermediaire*0.01*ponderation_reg
		when maille='NAT' then objectif_taux_avancement_intermediaire*0.01*ponderation_nat
	end as objectif_taux_avancement_intermediaire_pond,
	case 
		when maille='DEPT' then objectif_taux_avancement*0.01*ponderation_dept
		when maille='REG' then objectif_taux_avancement*0.01*ponderation_reg
		when maille='NAT' then objectif_taux_avancement*0.01*ponderation_nat
	end as objectif_taux_avancement_pond
	
	from expanded_ta_zones
),

-- Cette table contient une ligne par {ch,zone}. Les valeurs des différents indics du chantier sont mises dans des array (id_indic, ta_pondérés, date_va, ...).
collapse_per_ch_zone as (
	
	select chantier_id, territoire_code,
	array_agg(id) as ids,
	array_agg(ponderation_dept) as p_dept,
	array_agg(ponderation_reg) as p_reg,
	array_agg(ponderation_nat) as p_nat,
	array_agg(objectif_date_valeur_cible_intermediaire) as vca_agg,
	array_agg(objectif_taux_avancement_intermediaire) as taa_agg,
	array_agg(objectif_taux_avancement_intermediaire_pond) as taa_pond_agg,
	sum(objectif_taux_avancement_intermediaire_pond) as taa_ch,
	array_agg(objectif_date_valeur_cible) as vcg_agg,
	array_agg(objectif_taux_avancement) as tag_agg,
	array_agg(objectif_taux_avancement_pond) as tag_pond_agg,
	sum(objectif_taux_avancement_pond) as tag_ch
	from compute_ta_pond
	group by chantier_id, territoire_code 
)

select * from collapse_per_ch_zone

