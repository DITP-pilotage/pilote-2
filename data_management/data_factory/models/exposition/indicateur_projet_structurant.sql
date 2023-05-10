SELECT
    DISTINCT ON (indicateur_nom)
    {{ dbt_utils.surrogate_key(['indicateur_nom']) }} as id,
    indicateur_nom as nom,
    projet_structurant_code,
    CASE
        WHEN type_nom = 'RealisationHausse' OR type_nom = 'RealisationBaisse' THEN 'REALISATION'
        WHEN type_nom = 'FinancierHausse' OR type_nom = 'FinancierBaisse' THEN 'FINANCIER'
        ELSE 'IMPACT'
        END as type_id,
    indicateur_description as description,
    NULL as source,
    NULL as mode_de_calcul
    FROM {{ ref('stg_dfakto__ps_view_data_kpis') }}
    ORDER BY indicateur_nom
