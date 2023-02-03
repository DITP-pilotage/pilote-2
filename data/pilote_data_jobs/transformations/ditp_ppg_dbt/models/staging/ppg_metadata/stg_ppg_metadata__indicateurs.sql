with

source as (

    select * from {{ ref('metadata_indicateurs') }}

),

renamed as (

    select
        indic_id as id,
        indic_parent_indic as indicateur_parent_id,
        indic_parent_ch as chantier_id,
        indic_nom as nom,
        indic_descr as description,
        COALESCE(indic_is_perseverant, FALSE) as est_perseverant,
        COALESCE(indic_is_phare, FALSE) as est_phare,
        COALESCE(indic_is_baro, FALSE) as est_barometre,
        indic_type as type,
        indic_source as source,
        indic_source_url as source_url

    from source

)

select * from renamed
