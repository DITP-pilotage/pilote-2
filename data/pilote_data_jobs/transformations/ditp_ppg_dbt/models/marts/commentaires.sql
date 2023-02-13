WITH

commentaire AS (
    SELECT
        code_chantier,
        zone_code AS code_region,
        difficultes_rencontrees_et_risques_anticipes as frein_a_lever,
        difficultes_rencontrees_et_risques_anticipes_date_de_mise as date_frein_a_lever,
        solutions_proposees_et_prochaines_etapes as actions_a_venir,
        solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo as date_actions_a_venir,
        un_exemple_concret_de_reussite_liee_a_la_reforme as actions_a_valoriser,
        un_exemple_concret_de_reussite_liee_a_la_reforme_date_de as date_actions_a_valoriser,
        dernieres_realisations_et_suivi_des_decisions as autres_resultats_obtenus,
        dernieres_realisations_et_suivi_des_decisions_date_de_mise as date_autres_resultats_obtenus
    FROM {{ ref('stg_dfakto__view_data_properties')}} WHERE reforme_code <> '' OR region_code  <> '' OR departement_code  <> ''
)

(SELECT
    m_chantier.id as chantier_id,
    m_zone.maille,
    m_zone.code_insee,
    'frein_a_lever' as type,
    commentaire.frein_a_lever AS contenu,
    commentaire.date_frein_a_lever AS date
FROM {{ ref('stg_ppg_metadata__chantiers')}} m_chantier
    join commentaire ON m_chantier.id_chantier_perseverant = commentaire.code_chantier
    JOIN {{ ref('stg_ppg_metadata__zones')}} m_zone ON m_zone.id = commentaire.code_region
WHERE commentaire.frein_a_lever <> '')
UNION
(SELECT
     m_chantier.id as chantier_id,
     m_zone.maille,
     m_zone.code_insee,
     'actions_a_venir' as type,
     commentaire.actions_a_venir AS contenu,
     commentaire.date_actions_a_venir AS date
 FROM {{ ref('stg_ppg_metadata__chantiers')}} m_chantier
     join commentaire ON m_chantier.id_chantier_perseverant = commentaire.code_chantier
     JOIN {{ ref('stg_ppg_metadata__zones')}} m_zone ON m_zone.id = commentaire.code_region
 WHERE commentaire.actions_a_venir <> '')
 UNION
 (SELECT
      m_chantier.id as chantier_id,
      m_zone.maille,
      m_zone.code_insee,
      'actions_a_valoriser' as type,
      commentaire.actions_a_valoriser AS contenu,
      commentaire.date_actions_a_valoriser AS date
  FROM {{ ref('stg_ppg_metadata__chantiers')}} m_chantier
      join commentaire ON m_chantier.id_chantier_perseverant = commentaire.code_chantier
      JOIN {{ ref('stg_ppg_metadata__zones')}} m_zone ON m_zone.id = commentaire.code_region
  WHERE commentaire.actions_a_valoriser <> '')
UNION
(SELECT
    m_chantier.id as chantier_id,
    m_zone.maille,
    m_zone.code_insee,
    'autres_resultats_obtenus' as type,
    commentaire.autres_resultats_obtenus AS contenu,
    commentaire.date_autres_resultats_obtenus AS date
FROM {{ ref('stg_ppg_metadata__chantiers')}} m_chantier
    join commentaire ON m_chantier.id_chantier_perseverant = commentaire.code_chantier
    JOIN {{ ref('stg_ppg_metadata__zones')}} m_zone ON m_zone.id = commentaire.code_region
WHERE commentaire.autres_resultats_obtenus <> '')
