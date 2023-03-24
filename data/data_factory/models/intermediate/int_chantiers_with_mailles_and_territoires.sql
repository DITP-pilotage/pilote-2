WITH

chantiers_territorialises as (

	SELECT m_chantiers.id,
	    m_chantiers.nom,
	    m_chantiers.perimetre_ids,
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
	    m_chantiers.directeurs_projet_mails,
        m_chantiers.est_territorialise,
	    m_chantiers.id_chantier_perseverant,
	    m_chantiers.directeurs_administration_centrale_ids,
	    m_chantiers.ppg_id,
		m_zones.id as zone_id,
		m_zones.maille,
		m_zones.nom AS territoire_nom,
		m_zones.code_insee
	FROM {{ ref('stg_ppg_metadata__chantiers') }} m_chantiers
	JOIN {{ ref('stg_ppg_metadata__zones') }} m_zones ON m_chantiers.est_territorialise = TRUE AND m_zones.maille IN ('DEPT', 'REG', 'NAT')

),

chantiers_non_territorialises as (

	SELECT m_chantiers.id,
	    m_chantiers.nom,
	    m_chantiers.perimetre_ids,
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
	    m_chantiers.directeurs_projet_mails,
        m_chantiers.est_territorialise,
	    m_chantiers.id_chantier_perseverant,
	    m_chantiers.directeurs_administration_centrale_ids,
	    m_chantiers.ppg_id,
		m_zones.id as zone_id,
		m_zones.maille,
		m_zones.nom AS territoire_nom,
		m_zones.code_insee
	FROM {{ ref('stg_ppg_metadata__chantiers') }} m_chantiers
	JOIN {{ ref('stg_ppg_metadata__zones') }} m_zones ON m_chantiers.est_territorialise IS NOT TRUE AND m_zones.maille IN ('NAT')

)

SELECT * FROM chantiers_territorialises
UNION ALL
SELECT * FROM chantiers_non_territorialises
