SELECT 
    'ignored' AS tree_node_id, 
    taux_avancement_globale_borne AS objectif_taux_avancement,
    valeur_cible_globale AS objectif_valeur_cible,
    'todo' AS objectif_date_valeur_cible,
    taux_avancement_annuel_borne  AS objectif_taux_avancement_intermediaire,
    valeur_cible_annuelle  AS objectif_valeur_cible_intermediaire,
    'todo' AS objectif_date_valeur_cible_intermediaire,
    date_releve AS date_valeur_actuelle,
    'todo' AS date_valeur_initiale,
    valeur_actuelle,
    valeur_initiale,
    a.zone_id AS zone_code,
    'todo' AS nom_structure,
    a.indicateur_id AS effect_id,
    b.evolution_valeur_actuelle  AS evolution_valeur_actuelle,
    b.evolution_date_valeur_actuelle  AS evolution_date_valeur_actuelle,
    'todo' AS code_chantier
FROM {{ ref('taux_avancement_indicateur') }} a
LEFT JOIN {{ ref('evolution_indicateur') }} b ON a.indicateur_id = b.indicateur_id AND a.zone_id = b.zone_id 