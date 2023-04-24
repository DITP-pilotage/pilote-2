with avancement_indicateur as (
    SELECT
        indicateur_id,
        zone_id,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        date_valeur_initiale,
        date_valeur_actuelle,
        date_valeur_cible,
        avancement_global_borne
    FROM {{ ref('taux_avancement_indicateur__departement')}}
    WHERE zone_type_parent = 'REG'
    UNION
    SELECT
        indicateur_id,
        zone_id,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        date_valeur_initiale,
        date_valeur_actuelle,
        date_valeur_cible,
        avancement_global_borne
    FROM {{ ref('taux_avancement_indicateur__region')}}
    UNION
    SELECT
        indicateur_id,
        zone_id,
        valeur_initiale,
        valeur_actuelle,
        valeur_cible,
        date_valeur_initiale,
        date_valeur_actuelle,
        date_valeur_cible,
        avancement_global_borne
    FROM {{ ref('taux_avancement_indicateur__national')}}
)

SELECT m_indicateurs.id,
    m_indicateurs.nom,
    m_indicateurs.chantier_id,
    COALESCE(avancement_indicateur.valeur_cible, d_indicateurs.objectif_valeur_cible) as objectif_valeur_cible,
    COALESCE(avancement_indicateur.avancement_global_borne, d_indicateurs.objectif_taux_avancement) as objectif_taux_avancement,
    COALESCE(TO_CHAR(avancement_indicateur.date_valeur_cible, 'YYYY-MM-DD'), d_indicateurs.objectif_date_valeur_cible) as objectif_date_valeur_cible,
    m_indicateurs.indicateur_type_id as type_id,
    indicateur_types.nom AS type_nom,
    m_indicateurs.est_barometre,
    m_indicateurs.est_phare,
    COALESCE(avancement_indicateur.date_valeur_actuelle, d_indicateurs.date_valeur_actuelle) as date_valeur_actuelle,
    COALESCE(avancement_indicateur.date_valeur_initiale, d_indicateurs.date_valeur_initiale) as date_valeur_initiale,
    COALESCE(avancement_indicateur.valeur_actuelle, d_indicateurs.valeur_actuelle) as valeur_actuelle,
    COALESCE(avancement_indicateur.valeur_initiale, d_indicateurs.valeur_initiale) as valeur_initiale,
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
	LEFT JOIN avancement_indicateur ON m_indicateurs.id = avancement_indicateur.indicateur_id
	    AND chantiers_ayant_des_indicateurs.zone_id = avancement_indicateur.zone_id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} indicateur_types ON indicateur_types.id = m_indicateurs.indicateur_type_id
    LEFT JOIN {{ ref('int_dfakto_indicateurs_metrics') }} d_indicateurs ON m_indicateurs.nom = d_indicateurs.effect_id AND d_indicateurs.nom_structure IN ('Département', 'Région', 'Réforme')
ORDER BY m_indicateurs.nom, chantiers_ayant_des_indicateurs.maille, chantiers_ayant_des_indicateurs.code_insee, d_indicateurs.date_valeur_actuelle DESC
