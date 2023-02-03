with

dfakto_chantier as (

    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.avancement_borne,
        dim_tree_nodes.code_chantier,
        dim_tree_nodes.zone_code,
        dim_structures.nom as structure_nom,
        view_data_properties.meteo_nom,
        view_data_properties.objectifs_de_la_reforme,
        view_data_properties.objectifs_de_la_reforme_date_de_mise_a_jour
    FROM {{ ref('stg_dfakto__fact_progress_chantiers')}} fact_progress_chantier
        JOIN {{ ref('stg_dfakto__dim_tree_nodes')}} dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.id
        JOIN {{ ref('stg_dfakto__dim_structures')}} dim_structures ON dim_tree_nodes.structure_id = dim_structures.id
        LEFT JOIN {{ ref('stg_dfakto__view_data_properties')}} view_data_properties ON view_data_properties.reforme_code = dim_tree_nodes.code

),

dfakto_chantier_objectifs as (

    SELECT code_chantier,
        objectifs_de_la_reforme,
        objectifs_de_la_reforme_date_de_mise_a_jour
    FROM dfakto_chantier
    WHERE zone_code = 'FRANCE'

),

chantier_est_barometre as (
    SELECT m_indicateurs.chantier_id,
        bool_or(m_indicateurs.est_barometre) as est_barometre
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
    GROUP BY m_indicateurs.chantier_id
)

(SELECT m_chantiers.id,
        m_chantiers.nom,
        m_zones.code_insee,
        d_chantiers.avancement_borne AS taux_avancement,
        m_zones.nom AS territoire_nom,
        m_chantiers.perimetre_ids,
        m_zones.maille,
        array(SELECT m_porteurs.directeur
     		FROM   unnest(m_chantiers.directeurs_administration_centrale_ids) WITH ORDINALITY directeur(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = directeur.id
     		ORDER  BY directeur.i
     	) AS directeurs_administration_centrale,
        array(SELECT m_porteurs.nom_court
     		FROM   unnest(m_chantiers.ministeres_ids) WITH ORDINALITY ministere(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ministere.id
     		ORDER  BY ministere.i
     	) AS ministeres,
        array(SELECT m_porteurs.nom_court
     		FROM   unnest(m_chantiers.directeurs_administration_centrale_ids) WITH ORDINALITY direction(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = direction.id
     		ORDER  BY direction.i
     	) AS directions_administration_centrale,
        m_chantiers.directeurs_projet_noms AS directeurs_projet,
        COALESCE(chantier_meteos.id, 'NON_RENSEIGNEE') AS meteo,
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        d_chantiers.objectifs_de_la_reforme as objectifs,
        d_chantiers.objectifs_de_la_reforme_date_de_mise_a_jour as date_objectifs,
        chantier_est_barometre.est_barometre
    FROM {{ ref('stg_ppg_metadata__chantiers') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers ON m_chantiers.id_chantier_perseverant = d_chantiers.code_chantier AND d_chantiers.structure_nom='Réforme'
        LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} m_zones ON m_zones.id = 'FRANCE' -- ou = COALESCE(d_chantiers.zone_code, 'FRANCE') -- mais pas fan d'écrire ça ...
        LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ANY(m_chantiers.directeurs_administration_centrale_ids)
        LEFT JOIN {{ ref('stg_ppg_metadata__chantier_meteos') }} chantier_meteos ON chantier_meteos.nom_dfakto = d_chantiers.meteo_nom
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id)
UNION
    (SELECT m_chantiers.id,
        m_chantiers.nom,
        m_zones.code_insee,
        d_chantiers.avancement_borne AS taux_avancement,
        m_zones.nom AS territoire_nom,
        m_chantiers.perimetre_ids,
        m_zones.maille,
        array(SELECT m_porteurs.directeur
     		FROM   unnest(m_chantiers.directeurs_administration_centrale_ids) WITH ORDINALITY directeur(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = directeur.id
     		ORDER  BY directeur.i
     	) AS directeurs_administration_centrale,
        array(SELECT m_porteurs.nom_court
     		FROM   unnest(m_chantiers.ministeres_ids) WITH ORDINALITY ministere(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ministere.id
     		ORDER  BY ministere.i
     	) AS ministeres,
        array(SELECT m_porteurs.nom_court
     		FROM   unnest(m_chantiers.directeurs_administration_centrale_ids) WITH ORDINALITY direction(id, i)
     		JOIN   {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = direction.id
     		ORDER  BY direction.i
     	) AS directions_administration_centrale,
        m_chantiers.directeurs_projet_noms AS directeurs_projet,
        'NON_NECESSAIRE' AS meteo,
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        dfakto_chantier_objectifs.objectifs_de_la_reforme as objectifs,
        dfakto_chantier_objectifs.objectifs_de_la_reforme_date_de_mise_a_jour as date_objectifs,
        chantier_est_barometre.est_barometre
    FROM {{ ref('stg_ppg_metadata__chantiers') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers ON m_chantiers.id_chantier_perseverant = d_chantiers.code_chantier AND d_chantiers.structure_nom IN ('Région', 'Département')
        JOIN {{ ref('stg_ppg_metadata__zones') }} m_zones ON m_zones.id = d_chantiers.zone_code
        LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ANY(m_chantiers.directeurs_administration_centrale_ids)
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN dfakto_chantier_objectifs ON m_chantiers.id_chantier_perseverant = dfakto_chantier_objectifs.code_chantier
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id)
