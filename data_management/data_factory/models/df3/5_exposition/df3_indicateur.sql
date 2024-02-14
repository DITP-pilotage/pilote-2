{{ config(materialized='table') }}

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
--	- format cible: 1 seule ligne, contenant une liste des VACA evolution_valeur_actuelle
get_evol_vaca as (
	select 
	indic_id, zone_id,
	array_agg(metric_date::timestamp)as evolution_date_valeur_actuelle,
	array_agg(vaca) as evolution_valeur_actuelle,
	array_agg(taa_adate) as evolution_taa_adate
	from {{ ref('compute_ta_indic') }}
	where vaca is not null
	group by indic_id, zone_id
),
-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VACA
sort_mesures_vaca as (
	select *,
	rank() over (partition by indic_id, zone_id order by metric_date desc) as r
	from {{ ref('compute_ta_indic') }}
	where vaca is not null),
sort_mesures_vaca_last as (
	select * from sort_mesures_vaca where r=1
)

-- Jointure avec les tables référentielles	
	select 
	mi.indic_id as id,
	mi.indic_nom as nom,
	mi.indic_parent_ch as chantier_id,
	a.vcg as objectif_valeur_cible,
	tag as objectif_taux_avancement,
	mi.indic_type as type_id,
	mit.indic_type_name as type_nom,
	mi.indic_is_baro as est_barometre,
	mi.indic_is_phare as est_phare,
	a.metric_date::date as date_valeur_actuelle,
	a.vig_date::date as date_valeur_initiale,
	a.vaca as valeur_actuelle,
	a.vig as valeur_initiale,
	terr.code_insee,
	mz.zone_type as maille,
	terr.nom as territoire_nom,
	b.evolution_valeur_actuelle, b.evolution_date_valeur_actuelle, b.evolution_taa_adate,
	mi.indic_descr as description,
	mi.indic_source as "source",
	mi.indic_methode_calcul as mode_de_calcul,
	mi.indic_unite as unite_mesure,
	terr.code as territoire_code,
	mpi.poids_pourcent_dept as ponderation_dept,
	mpi.poids_pourcent_nat as ponderation_nat,
	mpi.poids_pourcent_reg as ponderation_reg,
	a.vcg_date::date as objectif_date_valeur_cible,
	a.vca_courant as objectif_valeur_cible_intermediaire,
	taa_courant as objectif_taux_avancement_intermediaire,
	-- Ajouter taa_adate ? ou pas besoin
	a.vca_courant_date::date as objectif_date_valeur_cible_intermediaire,
    COALESCE(z_appl.est_applicable, true) AS est_applicable,
	last_update_indic_zone.dernier_import_date,
    last_update_indic_zone.dernier_import_rapport_id,
    last_update_indic_zone.dernier_import_auteur,
    last_update_indic.dernier_import_date_indic,
    last_update_indic.dernier_import_rapport_id_indic,
    last_update_indic.dernier_import_auteur_indic,
    FALSE as a_supprimer
	from public.territoire t 
	cross join {{ ref('metadata_indicateurs') }} mi
	left join sort_mesures_vaca_last a on a.indic_id=mi.indic_id and a.zone_id=t.zone_id
	-- donc la liste des terr X liste des indic vont ressortir ici.
	-- list_indic_terr list_indic left join sort_mesures_va a on t.indic_id = list_indic.indic_id and t.zone_id = list_indic.zone_id
	left join get_evol_vaca b on mi.indic_id=b.indic_id and t.zone_id=b.zone_id
	--left join raw_data.metadata_indicateurs mi on mi1.indic_id = mi.indic_id 
	-- -- -- left join {{ ref('merge_computed_values') }} mcv on mi.indic_id=mcv.indic_id and t.zone_id=mcv.zone_id
	-- Récupération VIG, VCG, et VCA (redmine::621)
	--left join {{ ref('get_vig') }} gvig on mi.indic_id=gvig.indic_id and t.zone_id=gvig.zone_id
	--left join {{ ref('get_vcg') }} gvcg on mi.indic_id=gvcg.indic_id and t.zone_id=gvcg.zone_id
	--left join (select * from {{ ref('get_vca') }} where yyear=(date_part('year', now()))) gvca on mi.indic_id=gvca.indic_id and t.zone_id=gvca.zone_id
	left join {{ ref('metadata_indicateur_types') }} mit on mit.indic_type_id = mi.indic_type 
	left join {{ ref('metadata_parametrage_indicateurs') }} mpi on mi.indic_id = mpi.indic_id 
	left join public.territoire terr on t.zone_id = terr.zone_id 
	left join {{ ref('metadata_zones') }} mz on mz.zone_id = terr.zone_id 
	LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} z_appl ON z_appl.indic_id = mi.indic_id AND z_appl.zone_id = t.zone_id
	-- pour avoir le bon nombre de lignes, une par territoire
	right join list_indic_terr lit on mi.indic_id=lit.indic_id and terr.code=lit.territoire_code
	LEFT JOIN {{ ref('last_update_indic_zone') }} last_update_indic_zone ON mi.indic_id=last_update_indic_zone.indic_id AND t.code =last_update_indic_zone.territoire_code 
    LEFT JOIN {{ ref('last_update_indic') }} last_update_indic ON mi.indic_id=last_update_indic.indic_id
	--where a.r=1
	order by mi.indic_id, terr.code
