with

source as (

    select * from {{ source('import_from_files', 'mesure_indicateur') }}

),

renamed as (

    select
        id,
        indic_id as indicateur_id,
        zone_id,
        CASE
            WHEN metric_date = '2023-06-31'
                THEN TO_DATE('2023-06-30','YYYY-MM-DD')
            WHEN metric_date LIKE '%/%/%'
                THEN TO_DATE(metric_date,'DD/MM/YYYY')
            WHEN metric_date LIKE '%-%-%'
                THEN TO_DATE(metric_date,'YYYY-MM-DD')
            END AS date_releve,
        metric_type as type_mesure,
        CASE
            WHEN metric_value = 'null' THEN NULL 
            WHEN metric_value = 'undefined' THEN NULL 
            WHEN metric_value = '' THEN NULL 
            ELSE cast(metric_value AS numeric)
        END as valeur,
        date_import
    from source
    where metric_value <> 'null'

)

select * from renamed
