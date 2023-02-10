WITH

synthese AS (
    SELECT
        code_chantier,
        zone_code AS code_region,
        synthese_des_resultats,
        synthese_des_resultats_date_de_mise_a_jour,
        meteo_nom as meteo,
        meteo_date_de_mise_a_jour
    FROM {{ ref('stg_dfakto__view_data_properties')}} WHERE reforme_code <> '' OR region_code  <> '' OR departement_code  <> ''
)

SELECT m_chantier.id,
    m_zone.maille,
    m_zone.code_insee,
    synthese.meteo,
    synthese.meteo_date_de_mise_a_jour AS date_meteo,
    synthese.synthese_des_resultats AS commentaire,
    synthese.synthese_des_resultats_date_de_mise_a_jour AS date_commentaire
FROM {{ ref('stg_ppg_metadata__chantiers')}} m_chantier
    join synthese ON m_chantier.id_chantier_perseverant = synthese.code_chantier
    JOIN {{ ref('stg_ppg_metadata__zones')}} m_zone ON m_zone.id = synthese.code_region
WHERE synthese_des_resultats <> '' OR meteo <> ''
