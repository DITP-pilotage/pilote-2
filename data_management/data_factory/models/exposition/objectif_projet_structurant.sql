SELECT
DISTINCT ON(ps.id, dfakto_view.zone_code, dfakto_view.objectif, dfakto_view.objectif_date)
    ps.id as projet_structurant_id,
    dfakto_view.zone_code as territoire_id,
    dfakto_view.objectif as contenu,
    dfakto_view.objectif_date as date,
    NULL as auteur
FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant') }} ps 
    ON dfakto_view.projet_structurant_code = ps.code
WHERE dfakto_view.objectif_date IS NOT NULL AND dfakto_view.objectif IS NOT NULL
