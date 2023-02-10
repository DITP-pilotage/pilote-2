WITH

synthese AS (
    SELECT
        split_part(reforme_code, '-', 2) AS code_chantier,
        'FRANCE' AS code_region,
        synthese_des_resultats,
        synthese_des_resultats_date_de_mise_a_jour,
        meteo_nom as meteo,
        meteo_date_de_mise_a_jour
    FROM {{ ref('stg_dfakto__view_data_properties')}} WHERE reforme_code <> ''
    UNION
    SELECT
        split_part(region_code, '-', 1) AS code_chantier,
        split_part(region_code, '-', 2) AS code_region,
        synthese_des_resultats,
        synthese_des_resultats_date_de_mise_a_jour,
        meteo,
        meteo_date_de_mise_a_jour
    FROM raw_data.view_data_properties WHERE region_code  <> ''
    UNION
    SELECT
        split_part(departement_code, '-', 1) AS code_chantier,
        split_part(departement_code, '-', 2) AS code_region,
        synthese_des_resultats,
        synthese_des_resultats_date_de_mise_a_jour,
        meteo,
        meteo_date_de_mise_a_jour
    FROM raw_data.view_data_properties WHERE departement_code  <> ''
)

SELECT chantier_id,
    m_zone.zone_type AS maille,
    m_zone.zone_code AS code_insee,
    meteo,
    meteo_date_de_mise_a_jour AS date_meteo,
    synthese_des_resultats AS commentaire,
    synthese_des_resultats_date_de_mise_a_jour AS date_commentaire
FROM raw_data.metadata_chantier m_chantier
    join synthese ON m_chantier.ch_perseverant = synthese.code_chantier
    JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = synthese.code_region
WHERE synthese_des_resultats <> '' OR meteo <> ''
