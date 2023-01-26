{{
    config(
        unique_key='id',
        indexes=[
          {'columns': ['id'], 'type': 'hash'},
        ]
    )
}}

SELECT
    id,
    nom,
    ministere_nom as ministere
FROM {{ ref('stg_ppg_metadata__perimetres') }}