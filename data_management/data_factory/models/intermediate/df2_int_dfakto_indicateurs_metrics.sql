SELECT 
    'ignored' AS tree_node_id, 
    taux_avancement_globale_borne AS objectif_taux_avancement,
    valeur_cible_globale AS objectif_valeur_cible,
    -- Dans cette colonne, on sélectionne la dernière VC saisie, peu importe l'année visée.
    d.valeur_cible AS objectif_valeur_cible_colin,
    d.date_releve AS objectif_date_valeur_cible,
    taux_avancement_annuel_borne  AS objectif_taux_avancement_intermediaire,
    valeur_cible_annuelle  AS objectif_valeur_cible_intermediaire,
    -- Dans cette colonne, on sélectionne la VC de l'année la plus tardive, et non la dernière VC saisie par un utilisateur.
    c.valeur_cible as objectif_valeur_cible_intermediaire_colin,
    c.date_releve  AS objectif_date_valeur_cible_intermediaire,
    a.date_releve AS date_valeur_actuelle,
    g.date_releve AS date_valeur_initiale,
    valeur_actuelle,
    a.valeur_initiale,
    g.valeur_initiale as valeur_initiale_colin,
    a.zone_id AS zone_code,
    case
		when e.zone_type = 'DEPT' then 'Département'
		when e.zone_type = 'REG' then 'Région'
		when e.zone_type = 'NAT' then 'Chantier'
		else null
	end AS nom_structure,
    a.indicateur_id AS effect_id,
    b.evolution_valeur_actuelle  AS evolution_valeur_actuelle,
    b.evolution_date_valeur_actuelle  AS evolution_date_valeur_actuelle,
    f.indic_parent_ch AS code_chantier 
    FROM {{ ref('taux_avancement_indicateur') }}  a
LEFT JOIN {{ ref('evolution_indicateur') }} b ON a.indicateur_id = b.indicateur_id AND a.zone_id = b.zone_id 
left join {{ ref('last_vc_annuel') }} c on a.indicateur_id =c.indicateur_id and a.zone_id =c.zone_id and extract(year from a.date_releve)=c.yyear
left join {{ ref('last_vc_global') }} d on a.indicateur_id =d.indicateur_id and a.zone_id =d.zone_id
left join {{ ref('metadata_zones') }} e on a.zone_id =e.zone_id
left join {{ ref('metadata_indicateurs') }} f on a.indicateur_id =f.indic_id 
left join {{ ref('first_vi_global') }} g on a.indicateur_id =g.indicateur_id and a.zone_id =g.zone_id 
