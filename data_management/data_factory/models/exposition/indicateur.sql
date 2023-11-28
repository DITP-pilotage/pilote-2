SELECT m_indicateurs.id,
    m_indicateurs.nom,
    m_indicateurs.chantier_id,
    d_indicateurs.objectif_valeur_cible as objectif_valeur_cible,
    d_indicateurs.objectif_taux_avancement as objectif_taux_avancement,
    m_indicateurs.indicateur_type_id as type_id,
    indicateur_types.nom AS type_nom,
    m_indicateurs.est_barometre,
    m_indicateurs.est_phare,
    d_indicateurs.date_valeur_actuelle as date_valeur_actuelle,
    d_indicateurs.date_valeur_initiale as date_valeur_initiale,
    d_indicateurs.valeur_actuelle as valeur_actuelle,
    d_indicateurs.valeur_initiale as valeur_initiale,
    chantiers_ayant_des_indicateurs.code_insee,
    chantiers_ayant_des_indicateurs.maille,
    chantiers_ayant_des_indicateurs.territoire_nom,
    d_indicateurs.evolution_valeur_actuelle as evolution_valeur_actuelle,
    d_indicateurs.evolution_date_valeur_actuelle as evolution_date_valeur_actuelle,
    m_indicateurs.description,
    m_indicateurs.source,
    m_indicateurs.mode_de_calcul,
    m_indicateurs.unite as unite_mesure,
    CONCAT(chantiers_ayant_des_indicateurs.maille, '-', chantiers_ayant_des_indicateurs.code_insee) as territoire_code,
    parametrage_indicateurs.poids_pourcent_dept as ponderation_dept,
    parametrage_indicateurs.poids_pourcent_nat as ponderation_nat,
    parametrage_indicateurs.poids_pourcent_reg as ponderation_reg,
    d_indicateurs.objectif_date_valeur_cible as objectif_date_valeur_cible,
    d_indicateurs.objectif_valeur_cible_intermediaire,
    d_indicateurs.objectif_taux_avancement_intermediaire,
    d_indicateurs.objectif_date_valeur_cible_intermediaire,
    COALESCE(indicateur_zone.est_applicable, true) AS est_applicable,
    last_update_indic_zone.dernier_import_date,
    last_update_indic_zone.dernier_import_rapport_id,
    last_update_indic_zone.dernier_import_auteur,
    last_update_indic.dernier_import_date_indic,
    last_update_indic.dernier_import_rapport_id_indic,
    last_update_indic.dernier_import_auteur_indic,
    false AS a_supprimer
FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
	JOIN {{ ref('int_chantiers_with_mailles_and_territoires') }} chantiers_ayant_des_indicateurs ON m_indicateurs.chantier_id = chantiers_ayant_des_indicateurs.id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} indicateur_types ON indicateur_types.id = m_indicateurs.indicateur_type_id
    LEFT JOIN {{ ref('int_dfakto_indicateurs_metrics') }} d_indicateurs
	    ON m_indicateurs.id = d_indicateurs.effect_id
	    AND chantiers_ayant_des_indicateurs.id = d_indicateurs.code_chantier  -- TODO: a supprimer car temporaire pour bug dfakto avec ligne 43 du fichier int_dfakto_indicateurs_metrics.sql
	    AND chantiers_ayant_des_indicateurs.zone_id = d_indicateurs.zone_code
	    AND d_indicateurs.nom_structure IN ('Département', 'Région', 'Chantier')
	LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs') }} parametrage_indicateurs ON parametrage_indicateurs.indicateur_id = m_indicateurs.id
    LEFT JOIN {{ ref('int_indicateurs_zones_applicables')}} indicateur_zone ON indicateur_zone.indic_id = m_indicateurs.id AND indicateur_zone.zone_id = chantiers_ayant_des_indicateurs.zone_id
    LEFT JOIN {{ ref('last_update_indic_zone') }} last_update_indic_zone ON m_indicateurs.id=last_update_indic_zone.indic_id AND CONCAT(chantiers_ayant_des_indicateurs.maille, '-', chantiers_ayant_des_indicateurs.code_insee) =last_update_indic_zone.territoire_code 
    LEFT JOIN {{ ref('last_update_indic') }} last_update_indic ON m_indicateurs.id=last_update_indic.indic_id 
ORDER BY m_indicateurs.nom, chantiers_ayant_des_indicateurs.maille, chantiers_ayant_des_indicateurs.code_insee, d_indicateurs.date_valeur_actuelle DESC
