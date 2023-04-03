with

source as (

    select * from {{ source('import_from_files', 'mesures_indicateurs') }}

),

renamed as (

    select
        indic_id as indicateur_id,
        zone_id,
        TO_DATE(metric_date,'DD/MM/YYYY') as metric_date,
        metric_type,
        metric_value,
        import_date
    from source

)

select * from renamed