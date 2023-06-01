with

source as (

    select * from {{ ref('metadata_perimetres_projet_structurant') }}

),

renamed as (

    select
        perimetres_ppg_id,
        perimetres_ppg as perimetres_ppg_nom,
        perimetre_projets_structurants as perimetre_ps_nom

    from source

)

select * from renamed
