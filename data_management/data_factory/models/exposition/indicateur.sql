SELECT m_indicateurs.id,
    m_indicateurs.nom,
    m_indicateurs.chantier_id,
    d_indicateurs.objectif_valeur_cible as objectif_valeur_cible,
    d_indicateurs.objectif_taux_avancement as objectif_taux_avancement,
    d_indicateurs.objectif_date_valeur_cible as objectif_date_valeur_cible,
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
    COALESCE(pivot_faits_indicateur.evolution_valeur_actuelle, d_indicateurs.evolution_valeur_actuelle) as evolution_valeur_actuelle,
    COALESCE(pivot_faits_indicateur.evolution_date_valeur_actuelle, d_indicateurs.evolution_date_valeur_actuelle) as evolution_date_valeur_actuelle,
    m_indicateurs.description,
    m_indicateurs.source,
    m_indicateurs.mode_de_calcul,
    CONCAT(chantiers_ayant_des_indicateurs.maille, '-', chantiers_ayant_des_indicateurs.code_insee) as territoire_code,
    parametrage_indicateurs.poids_pourcent_dept as ponderation_dept,
    parametrage_indicateurs.poids_pourcent_nat as ponderation_nat,
    parametrage_indicateurs.poids_pourcent_reg as ponderation_reg
FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
	JOIN {{ ref('int_chantiers_with_mailles_and_territoires') }} chantiers_ayant_des_indicateurs ON m_indicateurs.chantier_id = chantiers_ayant_des_indicateurs.id
	LEFT JOIN {{ ref('taux_avancement_indicateur') }} ON m_indicateurs.id = taux_avancement_indicateur.indicateur_id
	    AND chantiers_ayant_des_indicateurs.zone_id = taux_avancement_indicateur.zone_id
	LEFT JOIN {{ ref("pivot_faits_indicateur")}} ON m_indicateurs.id = pivot_faits_indicateur.indicateur_id
        AND chantiers_ayant_des_indicateurs.zone_id = pivot_faits_indicateur.zone_id
        AND pivot_faits_indicateur.zone_type_parent <> 'ACAD'
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} indicateur_types ON indicateur_types.id = m_indicateurs.indicateur_type_id
    LEFT JOIN {{ ref('int_dfakto_indicateurs_metrics') }} d_indicateurs
	    ON m_indicateurs.id = d_indicateurs.effect_id
	    AND chantiers_ayant_des_indicateurs.id = d_indicateurs.code_chantier  -- TODO: a supprimer car temporaire pour bug dfakto avec ligne 43 du fichier int_dfakto_indicateurs_metrics.sql
	    AND chantiers_ayant_des_indicateurs.zone_id = d_indicateurs.zone_code
	    AND d_indicateurs.nom_structure IN ('Département', 'Région', 'Chantier')
	LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs') }} parametrage_indicateurs ON parametrage_indicateurs.indicateur_id = m_indicateurs.id
ORDER BY m_indicateurs.nom, chantiers_ayant_des_indicateurs.maille, chantiers_ayant_des_indicateurs.code_insee, d_indicateurs.date_valeur_actuelle DESC
