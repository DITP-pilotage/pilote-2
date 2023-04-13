with

source as (

    select * from {{ source('import_from_files', 'mesure_indicateur') }}

),

renamed as (

    select
        id,
        indic_id as indicateur_id,
        zone_id,
        TO_DATE(metric_date,'DD/MM/YYYY') as date_releve,
        metric_type as type_mesure,
        metric_value::numeric as valeur,
        date_import
    from source

)

select * from renamed
