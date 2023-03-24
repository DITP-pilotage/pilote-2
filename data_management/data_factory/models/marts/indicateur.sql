SELECT m_indicateurs.id,
    m_indicateurs.nom,
    m_indicateurs.chantier_id,
    d_indicateurs.objectif_valeur_cible,
    d_indicateurs.objectif_taux_avancement,
    d_indicateurs.objectif_date_valeur_cible,
    m_indicateurs.indicateur_type_id as type_id,
    indicateur_types.nom AS type_nom,
    m_indicateurs.est_barometre,
    m_indicateurs.est_phare,
    d_indicateurs.date_valeur_actuelle,
    d_indicateurs.date_valeur_initiale,
    d_indicateurs.valeur_actuelle,
    d_indicateurs.valeur_initiale,
    chantiers_ayant_des_indicateurs.code_insee,
    chantiers_ayant_des_indicateurs.maille,
    chantiers_ayant_des_indicateurs.territoire_nom,
    d_indicateurs.evolution_valeur_actuelle,
    d_indicateurs.evolution_date_valeur_actuelle,
    m_indicateurs.description,
    m_indicateurs.source,
    m_indicateurs.mode_de_calcul
FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
	JOIN {{ ref('int_chantiers_with_mailles_and_territoires') }} chantiers_ayant_des_indicateurs ON m_indicateurs.chantier_id = chantiers_ayant_des_indicateurs.id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} indicateur_types ON indicateur_types.id = m_indicateurs.indicateur_type_id
    LEFT JOIN {{ ref('int_dfakto_indicateurs_metrics') }} d_indicateurs ON m_indicateurs.nom = d_indicateurs.effect_id AND d_indicateurs.nom_structure IN ('Département', 'Région', 'Réforme')
ORDER BY m_indicateurs.nom, chantiers_ayant_des_indicateurs.maille, chantiers_ayant_des_indicateurs.code_insee, d_indicateurs.date_valeur_actuelle DESC
