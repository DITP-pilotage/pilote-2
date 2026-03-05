WITH
source AS (
    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_indicateurs"
),

renamed AS (
    SELECT
        indic_id AS id,
        indic_parent_indic AS indicateur_parent_id,
        indic_parent_ch AS chantier_id,
        indic_nom AS nom,
        indic_nom_baro AS nom_barometre,
        indic_descr AS description,
        indic_descr_baro AS description_barometre,
        indic_is_perseverant AS est_perseverant,
        indic_is_phare AS est_phare,
        indic_is_baro AS est_barometre,
        indic_type AS indicateur_type_id,
        indic_source AS source,
        indic_source_url AS source_url,
        indic_methode_calcul AS mode_de_calcul,
        indic_unite AS unite,
        indic_schema AS schema_validata,
        indic_hidden_pilote AS est_cache_dans_pilote,
        CAST(zg_applicable AS TEXT) AS zone_groupe_applicable,
        indic_territorialise AS est_territorialise,
        CASE 
            WHEN indic_territorialise THEN mailles
            ELSE 'NAT'
        END AS maille_la_plus_fine
    FROM source
)

SELECT * FROM renamed