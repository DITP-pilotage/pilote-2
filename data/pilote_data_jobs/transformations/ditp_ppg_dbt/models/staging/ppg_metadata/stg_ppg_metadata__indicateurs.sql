with

source as (

    select * from {{ source('ppg_metadata', 'metadata_indicateur') }}

),

renamed as (

    select
        indic_id as id,
        indic_parent_indic as indicateur_parent_id,
        indic_parent_ch as chantier_id,
        indic_nom as nom,
        indic_descr as description,
        indic_is_perseverant as est_perseverant,
        indic_is_phare as est_phare,
        indic_is_baro as est_barometre,
        indic_type as type

    from source

)

select * from renamed
