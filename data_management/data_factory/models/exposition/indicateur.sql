WITH

indicateurs_zone_applicables AS (
    SELECT DISTINCT 
        id AS indic_id,
        child_zone_id AS zone_id,
        true AS est_applicable
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} mi 
    LEFT JOIN {{ ref('stg_ppg_metadata__zonegroup_unnest') }} zu ON mi.zone_groupe_applicable = zu.zone_group_id 
    WHERE zone_groupe_applicable is not null
),
indicateurs_za_toutes_zone AS (
    SELECT DISTINCT
        indic_id,
        spmz.id AS zone_id
    FROM indicateurs_zone_applicables
    CROSS JOIN {{ ref('stg_ppg_metadata__zones') }} spmz
),
indicateurs_zone_applicable_final AS (
    SELECT
        indicateurs_za_toutes_zone.indic_id,
        indicateurs_za_toutes_zone.zone_id,
        COALESCE (indicateurs_zone_applicables.est_applicable, false) AS est_applicable
    FROM indicateurs_za_toutes_zone 
    LEFT JOIN indicateurs_zone_applicables 
    ON indicateurs_zone_applicables.indic_id = indicateurs_za_toutes_zone.indic_id 
    AND indicateurs_zone_applicables.zone_id = indicateurs_za_toutes_zone.zone_id
)

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
    COALESCE(indicateurs_zone_applicable_final.est_applicable, true) AS est_applicable,
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
    LEFT JOIN indicateurs_zone_applicable_final ON indicateurs_zone_applicable_final.indic_id = m_indicateurs.id AND indicateurs_zone_applicable_final.zone_id = chantiers_ayant_des_indicateurs.zone_id
ORDER BY m_indicateurs.nom, chantiers_ayant_des_indicateurs.maille, chantiers_ayant_des_indicateurs.code_insee, d_indicateurs.date_valeur_actuelle DESC
