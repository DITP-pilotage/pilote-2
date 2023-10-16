-- Reonstruction de la table indicateur



WITH 


-- Liste de tous les indicateurs, à toutes les territoires
list_indic_terr as (
	select 
	mi.indic_id as indic_id,
	t.code as territoire_code, 
	t.zone_id
	from public.territoire t 
	cross join {{ ref('metadata_indicateurs') }} mi
-- Pour prendre en compte le bool indic_hidden_pilote et ne pas retourner ces indicateurs:
--	where not coalesce (mi.indic_hidden_pilote, false)
),
-- Reformattage (pour chaque indicateur-zone):
--	- format source: 1 ligne pour chaque VA 
--	- format cible: 1 seule ligne, contenant une liste des VA evolution_valeur_actuelle
get_evol_va as (
	select 
	indic_id, zone_id,
	array_agg(metric_date)as evolution_date_valeur_actuelle,
	array_agg(va) as evolution_valeur_actuelle
	from df2.compute_ta_indic
	where va is not null
	group by indic_id, zone_id
),
-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VA
sort_mesures_va as (
	select *,
	rank() over (partition by indic_id, zone_id order by metric_date desc) as r
	from df2.compute_ta_indic
	where va is not null)

-- Jointure avec les tables référentielles	
	select 
	a.indic_id as id,
	mi.indic_nom as nom,
	mi.indic_parent_ch as chantier_id,
	vcg as objectif_valeur_cible,
	tag as objectif_taux_avancement,
	mi.indic_type as type_id,
	mit.indic_type_name as type_nom,
	mi.indic_is_baro as est_barometre,
	mi.indic_is_phare as est_phare,
	metric_date::date as date_valeur_actuelle,
	vig_date::date as date_valeur_initiale,
	va as valeur_actuelle,
	vig as valeur_initiale,
	terr.code_insee,
	terr."maille",
	terr.nom as territoire_nom,
	b.evolution_valeur_actuelle, b.evolution_date_valeur_actuelle,
	mi.indic_descr as description,
	mi.indic_source as "source",
	mi.indic_methode_calcul as mode_de_calcul,
	mi.indic_unite as unite_mesure,
	terr.code,
	mpi.poids_pourcent_dept as ponderation_dept,
	mpi.poids_pourcent_nat as ponderation_nat,
	mpi.poids_pourcent_reg as ponderation_reg,
	vcg_date as objectif_date_valeur_cible,
	vca as objectif_valeur_cible_intermediaire,
	taa as objectif_taux_avancement_intermediaire,
	vca_date as objectif_date_valeur_cible_intermediaire,
    COALESCE(z_appl.est_applicable, true) AS est_applicable,
    -- todo
    null as a_supprimer
	from sort_mesures_va a
	left join get_evol_va b on a.indic_id=b.indic_id and a.zone_id=b.zone_id
	left join {{ ref('metadata_indicateurs') }} mi on a.indic_id = mi.indic_id 
	left join {{ ref('metadata_indicateur_types') }} mit on mit.indic_type_id = mi.indic_type 
	left join {{ ref('metadata_parametrage_indicateurs') }} mpi on a.indic_id = mpi.indic_id 
	left join public.territoire terr on a.zone_id = terr.zone_id 
	LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} z_appl ON z_appl.indic_id = a.indic_id AND z_appl.zone_id = a.zone_id
	right join list_indic_terr lit on a.indic_id=lit.indic_id and terr.code=lit.territoire_code
	where r=1
	order by a.indic_id, terr.code
	