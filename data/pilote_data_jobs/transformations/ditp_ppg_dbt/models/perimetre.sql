{{
    config(
        unique_key='id',
        indexes=[
          {'columns': ['id'], 'type': 'hash'},
        ]
    )
}}

SELECT
    perimetre_id as id,
    per_nom as nom,
    per_porteur_name_short as ministere
FROM raw_data.metadata_perimetre