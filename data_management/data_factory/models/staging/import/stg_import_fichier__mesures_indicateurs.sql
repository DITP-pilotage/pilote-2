with

source as (

    select * from {{ source('import_from_files', 'mesures_indicateurs') }}

),

renamed as (

    select
        indic_id as indicateur_id,
        zone_id,
        TO_DATE(metric_date,'DD/MM/YYYY') as date_releve,
        metric_type as type_mesure,
        metric_value::numeric as valeur,
        import_date as date_import
    from source

)

select * from renamed