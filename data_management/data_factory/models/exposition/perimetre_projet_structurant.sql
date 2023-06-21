SELECT
    {{ dbt_utils.surrogate_key(
        ['perimetres_ppg_id',
        'perimetre_ps_nom']
    ) }} as id,
    perimetres.nom as perimetres_ppg_nom,
    perimetres_ppg_id,
    perimetre_ps_nom 
FROM {{ ref('stg_ppg_metadata__perimetres_ps') }}
    LEFT JOIN {{ ref('stg_ppg_metadata__perimetres') }} perimetres
ORDER BY perimetres_ppg_id
