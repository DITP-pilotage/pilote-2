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
    per_nom as nom
FROM {{ env_var('PGSCHEMA_RAW_DATA') }}.metadata_perimetre