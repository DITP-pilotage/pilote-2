WITH

chantiers_territorialises AS (

    SELECT
        m_chantiers.id,
        m_chantiers.nom,
        m_chantiers.perimetre_ids,
        ARRAY(
            SELECT m_porteurs.directeur
            FROM
                UNNEST(
                    m_chantiers.directeurs_administration_centrale_ids
                ) WITH ORDINALITY AS directeur (id, i)
            INNER JOIN
                "dev_pilote__6230"."raw_data"."stg_ppg_metadata__porteurs" AS m_porteurs
                ON directeur.id = m_porteurs.id
            ORDER BY directeur.i
        ) AS directeurs_administration_centrale,
        m_chantiers.ministeres_ids AS ministeres,
        ARRAY(
            SELECT m_porteurs.acronyme
            FROM
                UNNEST(
                    m_chantiers.directeurs_administration_centrale_ids
                ) WITH ORDINALITY AS direction (id, i)
            INNER JOIN
                "dev_pilote__6230"."raw_data"."stg_ppg_metadata__porteurs" AS m_porteurs
                ON direction.id = m_porteurs.id
            ORDER BY direction.i
        ) AS directions_administration_centrale,
        m_chantiers.directeurs_projet_noms AS directeurs_projet,
        m_chantiers.directeurs_projet_mails,
        m_chantiers.est_territorialise,
        m_chantiers.id_chantier_perseverant,
        m_chantiers.directeurs_administration_centrale_ids,
        m_chantiers.ppg_id,
        m_zones.id AS zone_id,
        m_zones.maille,
        m_zones.nom AS territoire_nom,
        m_zones.code_insee,
        m_chantiers.ate
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" AS m_chantiers
    INNER JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS m_zones
        ON
            m_chantiers.est_territorialise = TRUE
            AND m_zones.maille IN ('DEPT', 'REG', 'NAT')

),

chantiers_non_territorialises AS (

    SELECT
        m_chantiers.id,
        m_chantiers.nom,
        m_chantiers.perimetre_ids,
        ARRAY(
            SELECT m_porteurs.directeur
            FROM
                UNNEST(
                    m_chantiers.directeurs_administration_centrale_ids
                ) WITH ORDINALITY AS directeur (id, i)
            INNER JOIN
                "dev_pilote__6230"."raw_data"."stg_ppg_metadata__porteurs" AS m_porteurs
                ON directeur.id = m_porteurs.id
            ORDER BY directeur.i
        ) AS directeurs_administration_centrale,
        m_chantiers.ministeres_ids AS ministeres,
        ARRAY(
            SELECT m_porteurs.acronyme
            FROM
                UNNEST(
                    m_chantiers.directeurs_administration_centrale_ids
                ) WITH ORDINALITY AS direction (id, i)
            INNER JOIN
                "dev_pilote__6230"."raw_data"."stg_ppg_metadata__porteurs" AS m_porteurs
                ON direction.id = m_porteurs.id
            ORDER BY direction.i
        ) AS directions_administration_centrale,
        m_chantiers.directeurs_projet_noms AS directeurs_projet,
        m_chantiers.directeurs_projet_mails,
        m_chantiers.est_territorialise,
        m_chantiers.id_chantier_perseverant,
        m_chantiers.directeurs_administration_centrale_ids,
        m_chantiers.ppg_id,
        m_zones.id AS zone_id,
        m_zones.maille,
        m_zones.nom AS territoire_nom,
        m_zones.code_insee,
        m_chantiers.ate
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" AS m_chantiers
    INNER JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS m_zones
        ON
            m_chantiers.est_territorialise IS NOT TRUE
            AND m_zones.maille IN ('DEPT', 'REG', 'NAT')

)

SELECT * FROM chantiers_territorialises
UNION ALL
SELECT * FROM chantiers_non_territorialises