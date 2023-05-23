SELECT
DISTINCT ON(ps.id, dfakto_view.synthese_des_resultats_date, dfakto_view.meteo_date)
    {{ dbt_utils.surrogate_key(
        ['ps.id',
        'dfakto_view.synthese_des_resultats_date',
        'dfakto_view.meteo_date',
        ]
    ) }} as id,
    ps.id as projet_structurant_id,
    dfakto_view.meteo as meteo,
    dfakto_view.meteo_date as date_meteo,
    dfakto_view.synthese_des_resultats as commentaire,
    dfakto_view.synthese_des_resultats_date as date_commentaire,
    NULL as auteur
FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant') }} ps 
    ON dfakto_view.projet_structurant_code = ps.code
WHERE (dfakto_view.synthese_des_resultats IS NOT NULL AND dfakto_view.synthese_des_resultats_date IS NOT NULL)
    OR (dfakto_view.meteo IS NOT NULL AND dfakto_view.meteo_date IS NOT NULL)

