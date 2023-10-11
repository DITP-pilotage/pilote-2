-- On cherche à obtenir la dernière VA pour chaque {indicateur_id, zone_id}
--  Pour cela, on va grouper {{ ref('taux_avancement_indicateur') }} par indicateur_id, zone_id
--  puis la trier par date_releve desc
WITH taux_avancement_indicateur_rank AS (
    select 
    'ignored' AS tree_node_id, 
    taux_avancement_globale_borne,
    valeur_cible_globale,
    taux_avancement_annuel_borne,
    valeur_cible_annuelle,
    valeur_actuelle,
    date_releve, valeur_initiale, zone_id, indicateur_id,
    rank() over (partition by indicateur_id, zone_id order by date_releve desc) as r
    FROM {{ ref('taux_avancement_indicateur') }}  a
), 
-- On ne garde que la 1e ligne de chaque groupe (last_va)
taux_avancement_indicateur_last_va as (select * from taux_avancement_indicateur_rank where r=1)


-- Ici, on va reconstruire la nouvelle version de int_dfakto_indicateurs_metrics
SELECT 
    tree_node_id, 
    a.taux_avancement_globale_borne AS objectif_taux_avancement,
    a.valeur_cible_globale AS objectif_valeur_cible,
    a.taux_avancement_annuel_borne  AS objectif_taux_avancement_intermediaire,
    a.valeur_cible_annuelle  AS objectif_valeur_cible_intermediaire,
    -- Dans cette colonne, on sélectionne la dernière VC saisie, peu importe l'année visée.
    d.valeur_cible AS objectif_valeur_cible_colin,
    d.date_releve AS objectif_date_valeur_cible,
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
    FROM taux_avancement_indicateur_last_va a
LEFT JOIN {{ ref('evolution_indicateur') }} b ON a.indicateur_id = b.indicateur_id AND a.zone_id = b.zone_id 
LEFT JOIN {{ ref('last_vc_annuel') }} c ON a.indicateur_id =c.indicateur_id AND a.zone_id =c.zone_id AND extract(year from a.date_releve)=c.yyear
LEFT JOIN {{ ref('last_vc_global') }} d ON a.indicateur_id =d.indicateur_id AND a.zone_id =d.zone_id
LEFT JOIN {{ ref('metadata_zones') }} e ON a.zone_id =e.zone_id
LEFT JOIN {{ ref('metadata_indicateurs') }} f ON a.indicateur_id =f.indic_id 
LEFT JOIN {{ ref('first_vi_global') }} g ON a.indicateur_id =g.indicateur_id AND a.zone_id =g.zone_id 
