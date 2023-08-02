SELECT
DISTINCT ON(projet_structurant_temporaire.id, dfakto_view.objectif, dfakto_view.objectif_date)
    {{ dbt_utils.surrogate_key(
        ['projet_structurant_temporaire.id',
        'dfakto_view.objectif',
        'dfakto_view.objectif_date',
        ]
    ) }} as id,
    projet_structurant_temporaire.id as projet_structurant_id,
    'suivi_des_objectifs'::type_objectif_projet_structurant as type,
    dfakto_view.objectif as contenu,
    dfakto_view.objectif_date as date,
    NULL as auteur,
    false AS a_supprimer
FROM {{ ref('stg_dfakto__ps_view_data_financials') }} dfakto_view
    JOIN {{ ref('projet_structurant_temporaire') }} projet_structurant_temporaire 
    ON dfakto_view.projet_structurant_code = projet_structurant_temporaire.code
WHERE dfakto_view.objectif_date IS NOT NULL AND dfakto_view.objectif IS NOT NULL
