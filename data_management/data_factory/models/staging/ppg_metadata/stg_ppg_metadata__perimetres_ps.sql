with

source as (

    select * from {{ ref('metadata_perimetres_projet_structurant') }}

),

renamed as (

    select
        perimetre_id as perimetres_ppg_id,
        per_pst_nom as perimetre_ps_nom

    from source

)

select * from renamed
