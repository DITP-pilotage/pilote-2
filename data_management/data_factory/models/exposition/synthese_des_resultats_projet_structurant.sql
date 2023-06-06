SELECT
DISTINCT ON(projet_structurant_temporaire.id, dfakto_view.synthese_des_resultats_date, dfakto_view.meteo_date)
    {{ dbt_utils.surrogate_key(
        ['projet_structurant_temporaire.id',
        'dfakto_view.synthese_des_resultats_date',
        'dfakto_view.meteo_date',
        ]
    ) }} as id,
    projet_structurant_temporaire.id as projet_structurant_id,
    dfakto_view.meteo as meteo,
    dfakto_view.meteo_date as date_meteo,
    dfakto_view.synthese_des_resultats as commentaire,
    dfakto_view.synthese_des_resultats_date as date_commentaire,
    NULL as auteur
FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire 
    ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
WHERE (dfakto_view.synthese_des_resultats IS NOT NULL AND dfakto_view.synthese_des_resultats_date IS NOT NULL)
    OR (dfakto_view.meteo IS NOT NULL AND dfakto_view.meteo_date IS NOT NULL)

